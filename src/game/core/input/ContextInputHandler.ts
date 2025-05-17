/**
 * TerraFlux - Context Input Handler
 * 
 * Handles context-sensitive input mapping and processing.
 */

import { InputAction, InputContext, ContextAction } from './types';

/**
 * ContextInputHandler class
 * Maps input actions to different context-specific actions
 */
export class ContextInputHandler {
  private currentContext: InputContext = InputContext.DEFAULT;
  private contextActions: Map<InputContext, Map<InputAction, ContextAction>> = new Map();
  private contextChangedCallbacks: Array<(context: InputContext) => void> = [];
  
  /**
   * Constructor
   */
  constructor() {
    this.setupDefaultContexts();
  }
  
  /**
   * Set up default context mappings
   */
  private setupDefaultContexts(): void {
    // Set up default context
    const defaultContext = new Map<InputAction, ContextAction>();
    defaultContext.set(InputAction.CONTEXT_ACTION_PRIMARY, {
      context: InputContext.DEFAULT,
      action: InputAction.CONTEXT_ACTION_PRIMARY,
      label: 'Select',
      icon: 'select',
      handler: () => console.log('Default primary action')
    });
    defaultContext.set(InputAction.CONTEXT_ACTION_SECONDARY, {
      context: InputContext.DEFAULT,
      action: InputAction.CONTEXT_ACTION_SECONDARY,
      label: 'Cancel',
      icon: 'cancel',
      handler: () => console.log('Default secondary action')
    });
    this.contextActions.set(InputContext.DEFAULT, defaultContext);
    
    // Set up entity selected context
    const entitySelectedContext = new Map<InputAction, ContextAction>();
    entitySelectedContext.set(InputAction.CONTEXT_ACTION_PRIMARY, {
      context: InputContext.ENTITY_SELECTED,
      action: InputAction.CONTEXT_ACTION_PRIMARY,
      label: 'Move',
      icon: 'move',
      handler: () => console.log('Move entity')
    });
    entitySelectedContext.set(InputAction.CONTEXT_ACTION_SECONDARY, {
      context: InputContext.ENTITY_SELECTED,
      action: InputAction.CONTEXT_ACTION_SECONDARY,
      label: 'Cancel Selection',
      icon: 'cancel',
      handler: () => {
        console.log('Cancel entity selection');
        this.setContext(InputContext.DEFAULT);
      }
    });
    this.contextActions.set(InputContext.ENTITY_SELECTED, entitySelectedContext);
    
    // Set up building placement context
    const buildingPlacementContext = new Map<InputAction, ContextAction>();
    buildingPlacementContext.set(InputAction.CONTEXT_ACTION_PRIMARY, {
      context: InputContext.BUILDING_PLACEMENT,
      action: InputAction.CONTEXT_ACTION_PRIMARY,
      label: 'Place',
      icon: 'checkmark',
      handler: () => console.log('Place building')
    });
    buildingPlacementContext.set(InputAction.CONTEXT_ACTION_SECONDARY, {
      context: InputContext.BUILDING_PLACEMENT,
      action: InputAction.CONTEXT_ACTION_SECONDARY,
      label: 'Cancel Placement',
      icon: 'cancel',
      handler: () => {
        console.log('Cancel building placement');
        this.setContext(InputContext.DEFAULT);
      }
    });
    this.contextActions.set(InputContext.BUILDING_PLACEMENT, buildingPlacementContext);
    
    // Set up menu open context
    const menuOpenContext = new Map<InputAction, ContextAction>();
    menuOpenContext.set(InputAction.CONTEXT_ACTION_PRIMARY, {
      context: InputContext.MENU_OPEN,
      action: InputAction.CONTEXT_ACTION_PRIMARY,
      label: 'Select',
      icon: 'select',
      handler: () => console.log('Select menu item')
    });
    menuOpenContext.set(InputAction.CONTEXT_ACTION_SECONDARY, {
      context: InputContext.MENU_OPEN,
      action: InputAction.CONTEXT_ACTION_SECONDARY,
      label: 'Back',
      icon: 'back',
      handler: () => console.log('Go back in menu')
    });
    this.contextActions.set(InputContext.MENU_OPEN, menuOpenContext);
    
    // Set up dialog open context
    const dialogOpenContext = new Map<InputAction, ContextAction>();
    dialogOpenContext.set(InputAction.CONTEXT_ACTION_PRIMARY, {
      context: InputContext.DIALOG_OPEN,
      action: InputAction.CONTEXT_ACTION_PRIMARY,
      label: 'Confirm',
      icon: 'checkmark',
      handler: () => console.log('Confirm dialog')
    });
    dialogOpenContext.set(InputAction.CONTEXT_ACTION_SECONDARY, {
      context: InputContext.DIALOG_OPEN,
      action: InputAction.CONTEXT_ACTION_SECONDARY,
      label: 'Cancel',
      icon: 'cancel',
      handler: () => console.log('Cancel dialog')
    });
    this.contextActions.set(InputContext.DIALOG_OPEN, dialogOpenContext);
  }
  
  /**
   * Set the current context
   */
  public setContext(context: InputContext): void {
    const previousContext = this.currentContext;
    this.currentContext = context;
    
    // Notify context changed
    if (previousContext !== context) {
      this.contextChangedCallbacks.forEach(callback => callback(context));
    }
  }
  
  /**
   * Get the current context
   */
  public getContext(): InputContext {
    return this.currentContext;
  }
  
  /**
   * Get action for the current context
   */
  public getActionForInput(inputAction: InputAction): ContextAction | undefined {
    const contextMap = this.contextActions.get(this.currentContext);
    return contextMap?.get(inputAction);
  }
  
  /**
   * Handle input action in the current context
   */
  public handleInputAction(inputAction: InputAction, value: any = null): boolean {
    const action = this.getActionForInput(inputAction);
    
    if (action && action.handler) {
      action.handler(value);
      return true;
    }
    
    return false;
  }
  
  /**
   * Define a context action
   */
  public defineContextAction(
    context: InputContext,
    inputAction: InputAction,
    contextAction: ContextAction
  ): void {
    // Ensure the context action has the context and action properties set
    contextAction.context = context;
    contextAction.action = inputAction;
    let contextMap = this.contextActions.get(context);
    
    if (!contextMap) {
      contextMap = new Map<InputAction, ContextAction>();
      this.contextActions.set(context, contextMap);
    }
    
    contextMap.set(inputAction, contextAction);
  }
  
  /**
   * Get all defined actions for a context
   */
  public getActionsForContext(context: InputContext): Map<InputAction, ContextAction> | undefined {
    return this.contextActions.get(context);
  }
  
  /**
   * Register a callback for context changes
   */
  public onContextChanged(callback: (context: InputContext) => void): () => void {
    this.contextChangedCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.contextChangedCallbacks.indexOf(callback);
      if (index !== -1) {
        this.contextChangedCallbacks.splice(index, 1);
      }
    };
  }
  
  /**
   * Get context label for UI
   */
  public getContextLabel(context: InputContext): string {
    switch (context) {
      case InputContext.DEFAULT:
        return 'Default';
      case InputContext.ENTITY_SELECTED:
        return 'Entity Selected';
      case InputContext.BUILDING_PLACEMENT:
        return 'Building Placement';
      case InputContext.MENU_OPEN:
        return 'Menu';
      case InputContext.DIALOG_OPEN:
        return 'Dialog';
      default:
        return 'Unknown';
    }
  }
  
  /**
   * Get action labels for the current context (for UI)
   */
  public getCurrentContextActionLabels(): Record<string, string> {
    const result: Record<string, string> = {};
    const contextMap = this.contextActions.get(this.currentContext);
    
    if (contextMap) {
      for (const [action, contextAction] of contextMap.entries()) {
        result[InputAction[action]] = contextAction.label;
      }
    }
    
    return result;
  }
}
