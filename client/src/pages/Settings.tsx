import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, RefreshCw, Key } from "lucide-react";

// Settings form schema
const accountFormSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine(
  (data) => {
    if (data.newPassword && !data.password) {
      return false;
    }
    return true;
  },
  {
    message: "Current password is required to set a new password",
    path: ["password"],
  }
).refine(
  (data) => {
    if (data.newPassword && data.newPassword !== data.confirmPassword) {
      return false;
    }
    return true;
  },
  {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }
);

// Display preferences schema
const displayFormSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  currency: z.enum(["USD", "EUR", "GBP", "CAD", "AUD"]),
  showTutorials: z.boolean(),
  emailNotifications: z.boolean(),
});

// Category mapping schema
const categoryMappingSchema = z.object({
  housingKeywords: z.string(),
  transportationKeywords: z.string(),
  foodKeywords: z.string(),
  utilitiesKeywords: z.string(),
  healthcareKeywords: z.string(),
  entertainmentKeywords: z.string(),
});

export default function Settings() {
  const [activeTab, setActiveTab] = useState("account");
  const { toast } = useToast();

  // Account settings form
  const accountForm = useForm<z.infer<typeof accountFormSchema>>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      username: "demo",
      email: "demo@example.com",
      password: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Display preferences form
  const displayForm = useForm<z.infer<typeof displayFormSchema>>({
    resolver: zodResolver(displayFormSchema),
    defaultValues: {
      theme: "light",
      currency: "USD",
      showTutorials: true,
      emailNotifications: false,
    },
  });

  // Category mapping form
  const categoryForm = useForm<z.infer<typeof categoryMappingSchema>>({
    resolver: zodResolver(categoryMappingSchema),
    defaultValues: {
      housingKeywords: "rent, mortgage, home, property, housing",
      transportationKeywords: "gas, car, uber, lyft, transport, fuel",
      foodKeywords: "grocery, restaurant, food, meal, dining",
      utilitiesKeywords: "electric, water, phone, internet, utility",
      healthcareKeywords: "doctor, medical, health, insurance, pharmacy",
      entertainmentKeywords: "movie, cinema, netflix, spotify, subscription",
    },
  });

  // Handle form submissions
  const onAccountSubmit = (data: z.infer<typeof accountFormSchema>) => {
    toast({
      title: "Account settings updated",
      description: "Your account settings have been saved successfully.",
    });
  };

  const onDisplaySubmit = (data: z.infer<typeof displayFormSchema>) => {
    toast({
      title: "Display preferences updated",
      description: "Your display preferences have been saved successfully.",
    });
  };

  const onCategorySubmit = (data: z.infer<typeof categoryMappingSchema>) => {
    toast({
      title: "Category mappings updated",
      description: "Your category keyword mappings have been saved successfully.",
    });
  };

  return (
    <>
      {/* Top Navbar */}
      <div className="bg-white shadow-sm z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center">
            <h1 className="text-lg font-semibold">Settings</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6 lg:p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="display">Display</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          {/* Account Settings */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Update your account information and change your password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...accountForm}>
                  <form onSubmit={accountForm.handleSubmit(onAccountSubmit)} className="space-y-4">
                    <FormField
                      control={accountForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={accountForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-4 pt-4 border-t">
                      <h3 className="text-md font-medium">Change Password</h3>
                      <FormField
                        control={accountForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={accountForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={accountForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" className="mt-4">
                      <Save className="mr-2 h-4 w-4" /> Save Account Settings
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Display Preferences */}
          <TabsContent value="display" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Display Preferences</CardTitle>
                <CardDescription>
                  Customize how you want the dashboard to appear.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...displayForm}>
                  <form onSubmit={displayForm.handleSubmit(onDisplaySubmit)} className="space-y-4">
                    <FormField
                      control={displayForm.control}
                      name="theme"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Theme</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a theme" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="light">Light</SelectItem>
                              <SelectItem value="dark">Dark</SelectItem>
                              <SelectItem value="system">System</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select your preferred theme for the dashboard.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={displayForm.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="USD">USD ($)</SelectItem>
                              <SelectItem value="EUR">EUR (€)</SelectItem>
                              <SelectItem value="GBP">GBP (£)</SelectItem>
                              <SelectItem value="CAD">CAD (C$)</SelectItem>
                              <SelectItem value="AUD">AUD (A$)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select your preferred currency for displaying amounts.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={displayForm.control}
                      name="showTutorials"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Show Tutorials</FormLabel>
                            <FormDescription>
                              Display helpful tutorials and tips when using new features.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={displayForm.control}
                      name="emailNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Email Notifications</FormLabel>
                            <FormDescription>
                              Receive email notifications for monthly reports and important updates.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button type="submit">
                      <Save className="mr-2 h-4 w-4" /> Save Display Preferences
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Category Mapping */}
          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Category Mapping</CardTitle>
                <CardDescription>
                  Configure keywords that help categorize your transactions when importing statements.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...categoryForm}>
                  <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4">
                    <FormField
                      control={categoryForm.control}
                      name="housingKeywords"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Housing Keywords</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter keywords separated by commas" />
                          </FormControl>
                          <FormDescription>
                            Keywords that will map transactions to the Housing category.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={categoryForm.control}
                      name="transportationKeywords"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transportation Keywords</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter keywords separated by commas" />
                          </FormControl>
                          <FormDescription>
                            Keywords that will map transactions to the Transportation category.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={categoryForm.control}
                      name="foodKeywords"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Food Keywords</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter keywords separated by commas" />
                          </FormControl>
                          <FormDescription>
                            Keywords that will map transactions to the Food category.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={categoryForm.control}
                      name="utilitiesKeywords"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Utilities Keywords</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter keywords separated by commas" />
                          </FormControl>
                          <FormDescription>
                            Keywords that will map transactions to the Utilities category.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-4 justify-between">
                      <Button type="submit">
                        <Save className="mr-2 h-4 w-4" /> Save Category Mappings
                      </Button>
                      <Button type="button" variant="outline" onClick={() => categoryForm.reset()}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Reset to Defaults
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="bg-muted/50 mt-4">
                <div className="flex items-center text-xs text-muted-foreground gap-2">
                  <Key className="h-3 w-3" />
                  <span>Keywords are used to automatically categorize transactions when processing PDF statements.</span>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
