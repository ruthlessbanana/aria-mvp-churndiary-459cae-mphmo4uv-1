import { Bell } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationSettingsForm } from "@/features/churn-diary/components/notification-settings-form";

export default function NotificationSettingsPage() {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </CardTitle>
        <CardDescription>
          Configure when ChurnDiary emails you about upcoming trial conversions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <NotificationSettingsForm />
      </CardContent>
    </Card>
  );
}
