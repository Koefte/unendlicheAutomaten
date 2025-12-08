# Unendliche Automaten (Infinite Automata)

A visual interactive tool for exploring computation trees of infinite automata systems.

## Overview

Unendliche Automaten is an educational visualization tool built with p5.js and TypeScript that allows you to:

- Define custom automata rules with state transitions
- Visualize computation trees for input words
- Specify final/accepting states where computation terminates
- Interactively explore the computation space with zoom and pan controls
- Animate the step-by-step building of computation trees

## Features

### Core Functionality

- **Custom Rule Definition**: Define automata rules using JavaScript expressions for:
  - Conditions (predicates on the current state)
  - Input symbols (e.g., 'a', 'b', 'c')
  - State transitions (functions transforming the current state)

- **Computation Tree Visualization**: Watch as the tool builds an interactive tree showing:
  - All possible computation paths from the initial state
  - Branches for each applicable rule at each step
  - Node size decreases with tree depth for clarity

- **Final States Support**: Mark states with a predicate condition for termination:
  - Computation terminates when the predicate evaluates to true
  - Final states are visually highlighted with green color and double circles
  - Use JavaScript expressions like `n === 0`, `n < 5`, or `n % 3 === 1`

- **Interactive Controls**:
  - **Zoom**: Use mouse wheel to zoom in/out (0.1x to 10x)
  - **Pan**: Click and drag to move around the visualization
  - **Speed Control**: Slider to adjust animation speed (100-2000ms per node)

## Usage

### Input Format

#### 1. Rules (Textarea)

Define automata rules using the format:
```
(condition, inputSymbol) -> stateTransition
```

**Examples:**
```
n % 2 === 0, a -> n / 2
n % 2 === 1, b -> 3 * n + 1
n > 5, c -> n - 1
```

- **Condition**: Any JavaScript expression that returns `true` or `false`. Use `n` to reference the current state.
- **Input Symbol**: A string representing the symbol being processed (single or multiple characters)
- **State Transition**: A JavaScript expression that computes the next state from the current state `n`

#### 2. Input Word

Enter a sequence of symbols (e.g., `aabba`) that the automaton will process.

#### 3. Seed (Initial State)

Enter the initial state value (seed) to start the computation (e.g., `0`, `10`, `100`).
This determines the starting value for the computation tree. Default is `0`.

**Examples:**
- `0` - Start from state 0
- `10` - Start from state 10
- `100` - Start from state 100

#### 4. Final States

Enter a JavaScript condition (predicate) that determines when computation should terminate (e.g., `n === 0`, `n < 1`, `n % 2 === 0`).
Use `n` to reference the current state value. Leave empty if no final state condition is needed.

**Examples:**
- `n === 0` - Terminate when state equals 0
- `n === 1` - Terminate when state equals 1
- `n < 1` - Terminate when state is less than 1
- `n % 2 === 0` - Terminate when state is even

### Example: Collatz Sequence

```
Rules:
n % 2 === 0, a -> n / 2
n % 2 === 1, b -> 3 * n + 1

Input Word: aabba
Seed: 10
Final States: n === 1
```

This simulates the Collatz conjecture starting from state 10 where:
- Even states use 'a' symbol: divide by 2
- Odd states use 'b' symbol: multiply by 3 and add 1
- Computation terminates when state reaches 1

## User Interface

### Initial Screen
- **Rules textarea**: Top-left (400×200px) for defining automata rules
- **Input word field**: Below rules, accepts input sequence
- **Seed field**: Below input word, accepts a number for the initial state (default: 0)
- **Final states field**: Below seed, accepts a predicate condition on `n`
- **Submit button**: Triggers computation tree generation
- **Preset Management** (right side):
  - **Preset Name**: Input field for naming presets
  - **Save Preset**: Button to save current configuration
  - **Preset Select**: Dropdown to choose from saved presets
  - **Load**: Button to load selected preset
  - **Delete**: Button to remove selected preset

### Preset System

Presets allow you to save and load complete configurations (rules, input word, seed, and final states). Presets are stored in your browser's localStorage.

**To save a preset:**
1. Enter a name in the "Preset-Name" field
2. Click "Preset speichern"
3. Your configuration is now saved

**To load a preset:**
1. Select a preset from the dropdown
2. Click "Laden"
3. All fields are populated with the saved configuration

**To delete a preset:**
1. Select a preset from the dropdown
2. Click "Löschen"
3. Confirm the deletion

### Visualization Screen
- **Nodes**: Circles represent states
  - Light blue: Regular states
  - Green with double circle: Final states
- **Arrows**: Show transitions between states
- **Text**: State numbers displayed in node centers
- **Controls**: Zoom with mouse wheel, pan by dragging
- **Speed slider**: Adjust animation speed during playback

## Technical Details

### Architecture

- **Main File**: `main.ts` - Contains all core logic
- **Build System**: TypeScript compilation to JavaScript
- **Rendering**: p5.js for canvas-based visualization
- **Tree Structure**: Recursive computation tree with layout algorithm

### Key Data Structures

```typescript
type Rule = {
  a: (n: number) => boolean;  // Condition predicate
  f: (n: number) => number;   // State transition function
  A: string;                  // Input symbol
};

type Tree = {
  state: number;              // Current state
  inputPos: number;           // Position in input word
  children: Tree[];           // Child nodes (possible transitions)
  x?: number;                 // X coordinate for rendering
  y?: number;                 // Y coordinate for rendering
  size?: number;              // Node size (scales with depth)
};
```

### Algorithm Overview

1. **Parse Rules**: Convert input strings into executable rule objects
2. **Build Tree**: Recursively construct computation tree:
   - Terminate at final states
   - Terminate at end of input
   - Limit recursion depth to prevent infinite trees
3. **Layout**: Position nodes using breadth-first hierarchy layout
4. **Animate**: Draw nodes progressively based on timer

## Development

### Prerequisites

- Node.js and npm
- TypeScript compiler

### Setup

```bash
npm install
```

### Build

```bash
npx tsc
```

### Run

Open `index.html` in a web browser.

## Files

- `main.ts` - Main application logic (TypeScript)
- `index.html` - HTML entry point with p5.js library
- `tsconfig.json` - TypeScript configuration
- `package.json` - Project dependencies
- `README.md` - This file

## Notes

- All rules are evaluated in JavaScript context - be careful with syntax
- Maximum recursion depth is 20 levels to prevent performance issues
- The initial state is always 0
- Computation stops when: a final state is reached, input is exhausted, or max depth is reached

## Future Enhancements

Potential features for future development:
- Export computation trees as images or PDFs
- Load/save rule definitions
- Predefined rule sets (examples)
- Statistics on tree size and branching factor
- Simulation speed presets
- Rule validation and error suggestions

---

*Built for educational purposes to visualize infinite automata and computation trees.*
