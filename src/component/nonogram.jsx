import { useEffect, useRef } from "react";
const NONOGRAM = [[0, 0, 0, 0, 0],
                  [0, 0, 0, 0, 0],
                  [0, 0, 0, 0, 0],
                  [0, 0, 0, 0, 0],
                  [0, 0, 1, -1, -1]];
const GRID_SIZE = 50;
const LINE_PADDING = 8;

export default function Nonogram() {
    const canvasRef = useRef(null)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        const size = NONOGRAM.length;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        NONOGRAM.forEach((row, i) => {
            row.forEach((cell, j) => {
                const x = j * GRID_SIZE;
                const y = i * GRID_SIZE;
                ctx.fillStyle = (cell === 1) ? 'black' : 'white';
                ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
                if (cell === -1) {
                    ctx.fillStyle = 'white';
                    ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(x + LINE_PADDING, y + LINE_PADDING);
                    ctx.lineTo(x + GRID_SIZE - LINE_PADDING, y + GRID_SIZE - LINE_PADDING);   
                    ctx.moveTo(x + GRID_SIZE - LINE_PADDING, y + LINE_PADDING);
                    ctx.lineTo(x + LINE_PADDING, y + GRID_SIZE - LINE_PADDING);
                    ctx.stroke();          
                } 
                ctx.strokeStyle = 'gray';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, GRID_SIZE, GRID_SIZE);
            })
            
        })
    }, [NONOGRAM])

    return (
        <>
        <canvas 
            ref={canvasRef}
            width={NONOGRAM.length * GRID_SIZE}
            height={NONOGRAM.length * GRID_SIZE}></canvas>
        </>
    )
}