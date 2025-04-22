import React from 'react';
import { InviteUserForm } from '../components/InviteUserForm'; // Assuming form component path

const InviteUserPage: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Invite New User</h2>
      <p className="text-muted-foreground mb-6">
        Enter the details below to invite a new H&R or L&D user to a specific company.
      </p>
      <InviteUserForm />
    </div>
  );
};

export default InviteUserPage; 