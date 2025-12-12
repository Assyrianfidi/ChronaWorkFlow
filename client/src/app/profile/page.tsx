import { auth, authConfig } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';
import { redirect } from "next/navigation";
import { signOut } from "next-auth/react";

export default async function ProfilePage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { accounts: true },
  });

  if (!user) {
    await signOut({ redirect: false });
    redirect("/auth/signin");
  }

  const hasPassword = user.accounts.some(
    (account: any) => account.provider === "credentials",
  );
  const socialAccounts = user.accounts.filter(
    (account: any) => account.provider !== "credentials",
  );

  async function unlinkAccount(provider: string) {
    "use server";

    if (user?.accounts.length <= 1) {
      throw new Error("Cannot unlink the only account");
    }

    await prisma.account.deleteMany({
      where: {
        userId: user.id,
        provider,
      },
    });

    // Refresh the page to show updated accounts
    redirect("/profile");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Your Profile</h1>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Account Information
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {user.name || "Not set"}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {user.email}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Account Role
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === "ADMIN"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {user.role}
                  </span>
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Member Since
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {new Date(user.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Connected Accounts
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Manage your connected social accounts
            </p>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {socialAccounts.map((account: any) => (
                <li key={account.provider} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-500">
                          {account.provider === "google"
                            ? "G"
                            : account.provider === "github"
                              ? "GH"
                              : account.provider[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {account.provider.charAt(0).toUpperCase() +
                            account.provider.slice(1)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Connected on{" "}
                          {new Date(account.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    {socialAccounts.length > 1 && (
                      <form action={unlinkAccount.bind(null, account.provider)}>
                        <button
                          type="submit"
                          className="text-sm font-medium text-red-600 hover:text-red-500"
                        >
                          Unlink
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Danger Zone
            </h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <div className="sm:flex sm:items-start sm:justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  Delete account
                </h4>
                <p className="mt-1 text-sm text-gray-500">
                  Permanently delete your account and all associated data. This
                  action cannot be undone.
                </p>
              </div>
              <div className="mt-5 sm:mt-0 sm:ml-6 sm:flex-shrink-0 sm:flex sm:items-center">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
