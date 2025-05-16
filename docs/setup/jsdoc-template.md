# JSDoc Documentation Templates

This document provides standardized templates for JSDoc comments to be used throughout the TerraFlux codebase. Using consistent documentation patterns helps maintain readability and generates better API documentation.

## Class Documentation

```typescript
/**
 * TerraFlux - [Class Name]
 * 
 * [Brief description of the class's purpose]
 * 
 * @example
 * // Basic usage example
 * const instance = new ClassName(params);
 * instance.doSomething();
 */
class ClassName {
  /** [Property description] */
  public propertyName: PropertyType;
  
  /**
   * Constructor
   * 
   * @param options - Configuration options
   */
  constructor(options: OptionsType) {
    // implementation
  }
  
  /**
   * [Method description - what it does and why]
   * 
   * @param paramName - Description of parameter
   * @returns Description of return value
   * @throws {ErrorType} Description of when this error is thrown
   */
  public methodName(paramName: ParamType): ReturnType {
    // implementation
  }
}
```

## Interface Documentation

```typescript
/**
 * Interface for [description of what this interface represents]
 */
interface InterfaceName {
  /** [Property description] */
  propertyName: PropertyType;
  
  /** 
   * [Method description]
   * 
   * @param paramName - Description of parameter
   * @returns Description of return value
   */
  methodName(paramName: ParamType): ReturnType;
}
```

## Function Documentation

```typescript
/**
 * [Function description - what it does and why]
 * 
 * @param paramName - Description of parameter
 * @returns Description of return value
 * @throws {ErrorType} Description of when this error is thrown
 * 
 * @example
 * // Example usage
 * const result = functionName('example');
 */
function functionName(paramName: ParamType): ReturnType {
  // implementation
}
```

## Enum Documentation

```typescript
/**
 * [Enum description - what these values represent]
 */
enum EnumName {
  /** Description of this value */
  VALUE_ONE = 'value-one',
  
  /** Description of this value */
  VALUE_TWO = 'value-two'
}
```

## Type Documentation

```typescript
/**
 * [Type description - what this type represents and when to use it]
 */
type TypeName = {
  /** Description of this property */
  propertyName: PropertyType;
  
  /** Description of this property */
  optionalProperty?: PropertyType;
};
```

## File Header

Each file should begin with a header comment:

```typescript
/**
 * TerraFlux - [System Name]
 * 
 * [Brief description of the file's purpose and contents]
 * 
 * Part of the [larger system] module.
 */
```

## Common JSDoc Tags

Use these tags consistently throughout the codebase:

- `@param {type} name - Description` - Document a parameter
- `@returns {type} Description` - Document a return value
- `@throws {type} Description` - Document exceptions thrown
- `@example` - Provide usage examples
- `@deprecated Reason` - Mark deprecated features
- `@see OtherClass` - Reference related classes/functions
- `@private` - Mark private members (in addition to TypeScript's private modifier)
- `@internal` - For internal use only, not part of public API
- `@beta` - For features that are still in development/testing

## Special Components Documentation

### ECS Components

```typescript
/**
 * TerraFlux - [Component Name] Component
 * 
 * [Description of what this component represents in the game world]
 * 
 * @example
 * // Example of adding this component to an entity
 * entity.addComponent(new ComponentName({
 *   property: value
 * }));
 */
```

### Rendering Elements

```typescript
/**
 * TerraFlux - [Rendering Element Name]
 * 
 * [Description of what this rendering element does]
 * 
 * @example
 * // Example usage
 * const renderer = new RendererName({
 *   property: value
 * });
 * renderer.render();
 * 
 * @performance
 * [Notes about performance considerations]
 */
```

## Best Practices

1. **Be Comprehensive but Concise**
   - Document all public APIs thoroughly
   - Keep descriptions clear and to the point

2. **Focus on Intent**
   - Explain why something exists, not just what it does
   - Include use cases where appropriate

3. **Document Edge Cases**
   - Note special handling for null/undefined
   - Document performance implications for expensive operations

4. **Keep Documentation Updated**
   - Update docs when changing code
   - Remove documentation for removed features

5. **Use Consistent Style**
   - Start descriptions with capital letters
   - Use complete sentences with periods
   - Use present tense (e.g., "Returns" not "Will return")
