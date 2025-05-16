/**
 * TerraFlux - Global Type Definitions
 * 
 * This file contains global type definitions for the TerraFlux game.
 */

declare interface Window {
  /**
   * TerraFlux namespace for game components and utilities
   */
  TeraFlux?: {
    /**
     * Game module containing exported components and systems
     */
    Game?: {
      CoordinateSystem?: any;
      CoordinateSystemVerification?: any;
      HexPositionComponent?: any;
      HexPathfinding?: any;
      [key: string]: any;
    };
    [key: string]: any;
  };
  
  /**
   * Electron API bridge
   */
  electron: any;
}
