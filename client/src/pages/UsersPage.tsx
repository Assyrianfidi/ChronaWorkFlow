import { UsersList } from "@/components/users/UsersList";

export function UsersPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage user accounts, roles, and permissions
        </p>
      </div>
      <UsersList />
    </div>
  );
}
