
// Update service to use import hrEmployeeService correctly
import { Employee } from "/dev-server/src/services/hrEmployeeService";

// Export the hrEmployeeService with correct types
export { hrEmployeeService } from "/dev-server/src/services/hrEmployeeService";

// Re-export Employee type
export type { Employee };
