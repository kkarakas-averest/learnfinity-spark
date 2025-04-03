-- Script to insert sample course content
-- Run this in the Supabase SQL Editor after creating the tables with create-course-tables.sql

-- 1. Insert a sample course if it doesn't exist already
DO $$
DECLARE
  course_id UUID;
BEGIN
  -- Check if we have a sample TypeScript course
  SELECT id INTO course_id FROM public.courses WHERE title LIKE 'Advanced TypeScript%' LIMIT 1;
  
  -- If not, create one
  IF course_id IS NULL THEN
    INSERT INTO public.courses (
      title, 
      description, 
      level, 
      estimated_duration, 
      is_published, 
      created_at, 
      updated_at
    ) VALUES (
      'Advanced TypeScript for Modern Web Development',
      'Master TypeScript for building robust, scalable, and maintainable web applications with advanced type safety and modern design patterns.',
      'Intermediate',
      15, -- hours
      true,
      NOW(),
      NOW()
    ) RETURNING id INTO course_id;
  END IF;
  
  -- 2. Insert course modules
  -- Module 1: TypeScript Foundations
  WITH module_1 AS (
    INSERT INTO public.course_modules (
      course_id, 
      title, 
      description, 
      order_index, 
      duration, 
      content_type
    ) VALUES (
      course_id,
      'TypeScript Foundations',
      'Review core TypeScript concepts and establish a solid foundation for advanced topics.',
      1,
      180, -- 3 hours
      'text'
    ) RETURNING id
  ),
  -- Module 1 sections
  section_1_1 AS (
    INSERT INTO public.module_sections (
      module_id,
      title,
      content,
      content_type,
      order_index,
      duration
    ) VALUES (
      (SELECT id FROM module_1),
      'TypeScript vs JavaScript',
      '# TypeScript vs JavaScript

## Key Differences

TypeScript builds upon JavaScript by adding static type definitions. These type definitions help catch errors early in development rather than at runtime.

```typescript
// JavaScript
function add(a, b) {
  return a + b;
}

// TypeScript
function add(a: number, b: number): number {
  return a + b;
}
```

## Benefits of TypeScript

* **Static Type Checking**: Catch errors at compile time
* **Better IDE Support**: Improved autocompletion, navigation, and refactoring
* **Self-Documenting Code**: Types serve as documentation
* **Enhanced Refactoring**: Make large-scale changes with confidence

## When to Use TypeScript

TypeScript shines in larger projects where type safety becomes increasingly important for maintainability. It''s particularly valuable in team environments where it serves as living documentation.',
      'text',
      1,
      30
    )
  ),
  section_1_2 AS (
    INSERT INTO public.module_sections (
      module_id,
      title,
      content,
      content_type,
      order_index,
      duration
    ) VALUES (
      (SELECT id FROM module_1),
      'Working with Types',
      '# Working with Types

## Basic Types

```typescript
// Basic types
let isDone: boolean = false;
let decimal: number = 6;
let color: string = "blue";
let list: number[] = [1, 2, 3];
let tuple: [string, number] = ["hello", 10];
```

## Interfaces

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  age?: number; // Optional property
  readonly createdAt: Date; // Readonly property
}

function createUser(user: User): User {
  return {
    ...user,
    createdAt: new Date()
  };
}
```

## Type Aliases

```typescript
type ID = string | number;

type Point = {
  x: number;
  y: number;
};

function calculateDistance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}
```

## Union and Intersection Types

```typescript
// Union type
type Result = Success | Error;

interface Success {
  success: true;
  data: unknown;
}

interface Error {
  success: false;
  error: string;
}

// Intersection type
type Admin = User & {
  permissions: string[];
};
```',
      'text',
      2,
      45
    )
  ),
  section_1_3 AS (
    INSERT INTO public.module_sections (
      module_id,
      title,
      content,
      content_type,
      order_index,
      duration
    ) VALUES (
      (SELECT id FROM module_1),
      'TypeScript Configuration',
      '# TypeScript Configuration

## The tsconfig.json File

Every TypeScript project typically has a `tsconfig.json` file that defines how the TypeScript compiler should process files.

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.spec.ts"]
}
```

## Important Compiler Options

* **target**: The ECMAScript version to compile to
* **module**: The module system to use
* **strict**: Enable all strict type checking options
* **outDir**: Directory for output files
* **rootDir**: Root directory of source files

## Configuring for Different Environments

### For React Projects

```json
{
  "compilerOptions": {
    "jsx": "react",
    "lib": ["DOM", "DOM.Iterable", "ESNext"]
  }
}
```

### For Node.js Projects

```json
{
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "node",
    "esModuleInterop": true
  }
}
```',
      'text',
      3,
      35
    )
  ),
  -- Module 1 resources
  resource_1_1 AS (
    INSERT INTO public.course_resources (
      course_id,
      module_id,
      title,
      description,
      url,
      type
    ) VALUES (
      course_id,
      (SELECT id FROM module_1),
      'TypeScript Official Documentation',
      'Official TypeScript documentation with comprehensive guides and references',
      'https://www.typescriptlang.org/docs/',
      'link'
    )
  ),
  resource_1_2 AS (
    INSERT INTO public.course_resources (
      course_id,
      module_id,
      title,
      description,
      url,
      type
    ) VALUES (
      course_id,
      (SELECT id FROM module_1),
      'TypeScript Configuration Cheatsheet',
      'A comprehensive guide to tsconfig.json options and their effects',
      'https://example.com/typescript-config-cheatsheet.pdf',
      'pdf'
    )
  ),
  
  -- Module 2: Advanced Types
  module_2 AS (
    INSERT INTO public.course_modules (
      course_id, 
      title, 
      description, 
      order_index, 
      duration, 
      content_type
    ) VALUES (
      course_id,
      'Advanced Types',
      'Explore advanced TypeScript type features for creating robust type definitions.',
      2,
      240, -- 4 hours
      'text'
    ) RETURNING id
  ),
  -- Module 2 sections
  section_2_1 AS (
    INSERT INTO public.module_sections (
      module_id,
      title,
      content,
      content_type,
      order_index,
      duration
    ) VALUES (
      (SELECT id FROM module_2),
      'Generics',
      '# Generics in TypeScript

## Basic Generic Functions

Generics allow us to create reusable components that work with a variety of types rather than a single one.

```typescript
function identity<T>(arg: T): T {
  return arg;
}

const output = identity<string>("hello"); // Type is string
const output2 = identity(42); // Type inference works; type is number
```

## Generic Interfaces

```typescript
interface GenericResponse<T> {
  data: T;
  status: number;
  message: string;
  timestamp: Date;
}

function fetchData<T>(url: string): Promise<GenericResponse<T>> {
  return fetch(url)
    .then(response => response.json())
    .then(data => ({
      data,
      status: 200,
      message: "Success",
      timestamp: new Date()
    }));
}

// Usage
interface User {
  id: number;
  name: string;
}

const getUserData = async () => {
  const response = await fetchData<User>("/api/user");
  // response.data is typed as User
  console.log(response.data.name);
};
```

## Generic Constraints

```typescript
interface HasLength {
  length: number;
}

function logLength<T extends HasLength>(arg: T): T {
  console.log(arg.length); // Now we can access .length property
  return arg;
}

logLength("hello");     // Works: string has .length
logLength([1, 2, 3]);   // Works: array has .length
// logLength(123);      // Error: number doesn''t have .length
```

## Generic Classes

```typescript
class DataStore<T> {
  private data: T[] = [];

  add(item: T): void {
    this.data.push(item);
  }

  getItems(): T[] {
    return this.data;
  }
}

const userStore = new DataStore<User>();
userStore.add({ id: 1, name: "John" });
const users = userStore.getItems(); // Type is User[]
```

## Type Parameters in Generic Constraints

```typescript
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { id: 1, name: "John", email: "john@example.com" };
const userName = getProperty(user, "name");  // Works
// const invalid = getProperty(user, "age"); // Error: "age" is not in keyof User
```',
      'text',
      1,
      60
    )
  ),
  section_2_2 AS (
    INSERT INTO public.module_sections (
      module_id,
      title,
      content,
      content_type,
      order_index,
      duration
    ) VALUES (
      (SELECT id FROM module_2),
      'Utility Types',
      '# TypeScript Utility Types

TypeScript provides several utility types to help with common type transformations.

## Partial<T>

Makes all properties in T optional.

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

function updateUser(id: number, userUpdate: Partial<User>) {
  // Implementation
}

// We only need to provide the properties we want to update
updateUser(1, { name: "New Name" });
```

## Required<T>

Makes all properties in T required.

```typescript
interface Config {
  endpoint?: string;
  timeout?: number;
  retries?: number;
}

// strictConfig has all properties required
type StrictConfig = Required<Config>;
```

## Pick<T, K>

Creates a type by picking the set of properties K from T.

```typescript
interface Article {
  id: number;
  title: string;
  content: string;
  author: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Just what we need for a list view
type ArticlePreview = Pick<Article, "id" | "title" | "author" | "createdAt">;
```

## Omit<T, K>

Creates a type by omitting the set of properties K from T.

```typescript
// Omit timestamps and internal ID
type ArticleInput = Omit<Article, "id" | "createdAt" | "updatedAt">;
```

## Record<K, T>

Constructs a type with properties of K and values of type T.

```typescript
type UserRoles = Record<string, string[]>;

const roles: UserRoles = {
  admin: ["read", "write", "delete"],
  editor: ["read", "write"],
  viewer: ["read"]
};
```

## ReturnType<T>

Extracts the return type of a function type.

```typescript
function createUser(name: string, email: string) {
  return {
    id: Date.now(),
    name,
    email,
    createdAt: new Date()
  };
}

type User = ReturnType<typeof createUser>;
```

## Parameters<T>

Extracts parameter types from a function type as a tuple.

```typescript
type CreateUserParams = Parameters<typeof createUser>;
// type is [string, string]
```

## Combining Utility Types

Utility types can be combined for more complex transformations.

```typescript
// Make a type with only some fields optional
type PartialArticlePreview = Partial<Pick<Article, "tags" | "author">> & 
  Pick<Article, "id" | "title">;
```',
      'text',
      2,
      45
    )
  ),
  section_2_3 AS (
    INSERT INTO public.module_sections (
      module_id,
      title,
      content,
      content_type,
      order_index,
      duration
    ) VALUES (
      (SELECT id FROM module_2),
      'Type Guards and Type Assertions',
      '# Type Guards and Type Assertions

## Type Guards

Type guards help narrow down the type of a variable within a conditional block.

### Using typeof

```typescript
function process(value: string | number) {
  if (typeof value === "string") {
    // TypeScript knows value is a string here
    return value.toUpperCase();
  } else {
    // TypeScript knows value is a number here
    return value.toFixed(2);
  }
}
```

### Using instanceof

```typescript
class Dog {
  bark() { return "Woof!"; }
}

class Cat {
  meow() { return "Meow!"; }
}

function makeSound(animal: Dog | Cat) {
  if (animal instanceof Dog) {
    return animal.bark();
  } else {
    return animal.meow();
  }
}
```

### User-Defined Type Guards

```typescript
interface Fish {
  swim(): void;
  layEggs(): void;
}

interface Bird {
  fly(): void;
  layEggs(): void;
}

function isFish(pet: Fish | Bird): pet is Fish {
  return (pet as Fish).swim !== undefined;
}

function getActivity(pet: Fish | Bird) {
  if (isFish(pet)) {
    // TypeScript knows pet is Fish
    return pet.swim();
  } else {
    // TypeScript knows pet is Bird
    return pet.fly();
  }
}
```

### Discriminated Unions

```typescript
interface Square {
  kind: "square";
  size: number;
}

interface Rectangle {
  kind: "rectangle";
  width: number;
  height: number;
}

interface Circle {
  kind: "circle";
  radius: number;
}

type Shape = Square | Rectangle | Circle;

function area(shape: Shape): number {
  switch (shape.kind) {
    case "square":
      return shape.size ** 2;
    case "rectangle":
      return shape.width * shape.height;
    case "circle":
      return Math.PI * shape.radius ** 2;
    default:
      // Exhaustiveness check
      const _exhaustiveCheck: never = shape;
      return _exhaustiveCheck;
  }
}
```

## Type Assertions

Type assertions tell the compiler you know more about the type than it does.

### Basic Assertions

```typescript
const value: any = "hello";
const length: number = (value as string).length;
// Alternative syntax (except in .tsx files)
const length2: number = (<string>value).length;
```

### Non-null Assertion Operator

```typescript
function getUser(id: number) {
  return id > 0 ? { name: "John" } : null;
}

// Using non-null assertion (!) when we''re sure it''s not null
const user = getUser(42)!;
console.log(user.name); // No error
```

### const Assertions

```typescript
// Without const assertion
const colors = ["red", "green", "blue"]; // string[]

// With const assertion
const colorsConst = ["red", "green", "blue"] as const; // readonly ["red", "green", "blue"]

// Useful for making object properties readonly too
const config = {
  endpoint: "/api",
  method: "GET"
} as const;
// Now config.method is of type "GET" instead of string
```

## Best Practices

- Use type guards when possible instead of type assertions
- Avoid using `any` and assertions unless absolutely necessary
- Use discriminated unions for complex type hierarchies
- Use assertions only when you have more information than the compiler',
      'text',
      3,
      50
    )
  ),
  -- Module 2 resources
  resource_2_1 AS (
    INSERT INTO public.course_resources (
      course_id,
      module_id,
      title,
      description,
      url,
      type
    ) VALUES (
      course_id,
      (SELECT id FROM module_2),
      'TypeScript Advanced Types Deep Dive',
      'A comprehensive exploration of advanced TypeScript type features',
      'https://example.com/videos/typescript-advanced-types',
      'video'
    )
  ),
  resource_2_2 AS (
    INSERT INTO public.course_resources (
      course_id,
      module_id,
      title,
      description,
      url,
      type
    ) VALUES (
      course_id,
      (SELECT id FROM module_2),
      'Utility Types Reference',
      'Complete reference for TypeScript utility types with examples',
      'https://example.com/typescript-utility-types.pdf',
      'pdf'
    )
  )
  SELECT 'Sample course content inserted successfully!';
END $$; 