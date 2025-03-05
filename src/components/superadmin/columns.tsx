
import React from "@/lib/react-helpers";
import { Button } from "@/components/ui/button";

// Define the User interface directly since we can't import it
interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

export const columns = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "role",
    header: "Role",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }: { row: { original: User } }) => {
      return (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Edit
          </Button>
          <Button variant="destructive" size="sm">
            Delete
          </Button>
        </div>
      );
    },
  },
];
