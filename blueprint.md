# Trading Behavior Review Site Blueprint

## Overview

This document outlines the plan for a professional Trading Behavior Review (트레이딩 리뷰 허브) web application. The app allows traders to log their trades, track performance metrics (P/L, Win Rate), and review their decision-making process. It features a modern financial dashboard design.

## Project Outline

*   **index.html**: Main structure for the trading dashboard.
*   **style.css**: CSS for a professional financial UI.
*   **main.js**: Logic for trade management and performance analytics.

### Core Features & Design

1.  **Professional UI/UX**:
    *   **Color Palette**: Financial theme with distinct Green (Profit) and Red (Loss) using `oklch`.
    *   **Typography**: Clean 'Poppins' font for readability.
    *   **Iconography**: Material Icons for assets and trade types.

2.  **Performance Summary**:
    *   **Net P/L**: Total profit minus total loss.
    *   **Total Profit**: Sum of all winning trades.
    *   **Total Loss**: Sum of all losing trades.
    *   **Win Rate**: Percentage of profitable trades.

3.  **Trade Log Form**:
    *   **Asset**: Trading symbol (e.g., BTC, AAPL, NVDA).
    *   **Type**: Long (Buy) or Short (Sell).
    *   **Amount**: Profit or Loss amount.
    *   **Strategy**: Categorize by strategy (e.g., Breakout, Scalping).
    *   **Notes**: Personal review and emotional state during the trade.

4.  **Trade Screenshot Scanner (OCR)**:
    *   Upload trade history screenshots to automatically extract P/L and dates using Tesseract.js.

5.  **Trade List**:
    *   A chronological list of trades using the `<trade-entry>` custom element, color-coded by performance.

## Implementation Plan

1.  **Rebranding (index.html)**: Update all text to trading terminology and add the Win Rate card.
2.  **Logic Update (main.js)**:
    *   Rename variables to `trades`.
    *   Implement Win Rate calculation.
    *   Update `<trade-entry>` component to display asset and strategy.
3.  **Visual Refinement (style.css)**:
    *   Update summary grid for 4 cards.
    *   Refine colors for profit/loss contrast.
