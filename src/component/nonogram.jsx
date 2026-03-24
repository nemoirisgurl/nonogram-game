import { useState, useEffect, useRef } from "react";

// Game Constants: Adjusting these will scale the UI automatically
const NONOGRAM = [
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0]
];
const GRID_SIZE = 50;   // Pixel size of each square cell
const LINE_PADDING = 8; // Margin for the 'X' mark in crossed-out cells

export default function Nonogram() {
    const [grid, setGrid] = useState(NONOGRAM);
    const canvasRef = useRef(null);

    /**
     * Handles cell interaction.
     * Toggles cell state: 0 (Empty) -> 1 (Filled) -> -1 (Crossed)
     */
    const handleClick = (e, isRightClick=false) => {
        if (isRightClick) e.preventDefault();

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        
        // Calculate click coordinates relative to the canvas origin
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Map pixel coordinates to grid indices
        const row = Math.floor(y / GRID_SIZE);
        const col = Math.floor(x / GRID_SIZE);

        setGrid(prevGrid => {
            // 1. Shallow copy the grid (the "rows" array)
            const newGrid = [...prevGrid];
            
            // 2. Deep copy only the target row to maintain immutability
            const newRow = [...newGrid[row]];

            // 3. Apply state logic
            const current = newRow[col];
            if (isRightClick) {
                newRow[col] = current === -1 ? 0 : -1;
            } else {
                newRow[col] = current === 0 ? 1 : 0;
            }

            // 4. Update only that specific row reference
            newGrid[row] = newRow;
            return newGrid; 
        })
    }

    /**
     * Effect: Re-renders the Canvas whenever the grid state changes.
     * Handles drawing squares, grid lines, and the "X" marks.
     */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        grid.forEach((row, i) => {
            row.forEach((cell, j) => {
                const x = j * GRID_SIZE;
                const y = i * GRID_SIZE;

                // 1. Draw Cell Background (Black for filled, White for others)
                ctx.fillStyle = (cell === 1) ? 'black' : 'white';
                ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);

                // 2. Draw "X" for Crossed Cells (State: -1)
                if (cell === -1) {
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    // Forward slash
                    ctx.moveTo(x + LINE_PADDING, y + LINE_PADDING);
                    ctx.lineTo(x + GRID_SIZE - LINE_PADDING, y + GRID_SIZE - LINE_PADDING);   
                    // Backward slash
                    ctx.moveTo(x + GRID_SIZE - LINE_PADDING, y + LINE_PADDING);
                    ctx.lineTo(x + LINE_PADDING, y + GRID_SIZE - LINE_PADDING);
                    ctx.stroke();          
                } 

                // 3. Draw Grid Borders
                ctx.strokeStyle = 'gray';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, GRID_SIZE, GRID_SIZE);
            })
        })
    }, [grid])

    return (
        <canvas 
            ref={canvasRef}
            width={grid[0].length * GRID_SIZE}
            height={grid.length * GRID_SIZE}
            onClick={e => {handleClick(e, false)}} // Left click for fill 
            onContextMenu={e => {handleClick(e, true)}} // Right click for cross
        />
    )
}