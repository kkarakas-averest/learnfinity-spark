
import React from "@/lib/react-helpers";
import { useState, useEffect } from '@/lib/react-helpers';
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";

// Create minimal column definitions for course management
const columns = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }: { row: any }) => {
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

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching courses
    setTimeout(() => {
      setCourses([
        { id: 1, title: "Introduction to HR", category: "HR", status: "Published" },
        { id: 2, title: "Employee Relations", category: "HR", status: "Draft" },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Course Management</h2>
        <Button>Add New Course</Button>
      </div>

      {loading ? (
        <div>Loading courses...</div>
      ) : (
        <DataTable columns={columns} data={courses} />
      )}
    </div>
  );
};

export default CourseManagement;
