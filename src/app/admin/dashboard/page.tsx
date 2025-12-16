import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-headline text-primary mb-6">Admin Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Welcome, Admin!</CardTitle>
            <CardDescription>
              This is your control center for DoceLink.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>From here, you can manage products, view orders, and update news articles for the homepage.</p>
            <p className="mt-4 text-sm text-muted-foreground">Use the navigation above to get started.</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>
              A quick look at your store's performance.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-muted-foreground">Statistics will be shown here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
