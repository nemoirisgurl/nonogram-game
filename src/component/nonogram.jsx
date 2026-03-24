import { useState, useEffect, useRef } from "react";
const NONOGRAM = [[0, 0, 0, 0, 0],
                  [0, 0, 0, 0, 0],
                  [0, 0, 0, 0, 0],
                  [0, 0, 0, 0, 0],
                  [0, 0, 0, 0, 0]];
const GRID_SIZE = 50;
const LINE_PADDING = 8;


export default function Nonogram() {
    const [grid, setGrid] = useState(NONOGRAM);
    const canvasRef = useRef(null);
    const handleClick = (e) => {
        const toggleState = (currentState) => {
            const sequence = [1, 0, -1];
            const currentIdx = sequence.indexOf(currentState);
            const nextIdx = (currentIdx + 1) % sequence.length;
            console.log(sequence[nextIdx])
            return sequence[nextIdx];
        }
        const canvas = canvasRef.current;
        const cell = canvas.getBoundingClientRect();
        const x = e.clientX - cell.left;
        const y = e.clientY - cell.top;
        const row = Math.floor(y / GRID_SIZE);
        const col = Math.floor(x / GRID_SIZE);
        const newGrid = grid.map((rows, i) => {
            return rows.map((cell, j) => {
                if (i === row && j === col) {
                    return toggleState(cell);
                }
                return cell;
            })
        })
        setGrid(newGrid);
    }

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        const size = grid.length;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        grid.forEach((row, i) => {
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
    }, [grid])

    return (
        <>
        <canvas 
            ref={canvasRef}
            width={grid.length * GRID_SIZE}
            height={grid.length * GRID_SIZE}
            onClick={handleClick}></canvas>
        </>
    )
}