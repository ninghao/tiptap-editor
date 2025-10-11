<script setup lang="ts">
import { ref } from 'vue';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  User,
  Settings,
  Bell,
  Shield,
  Palette,
  Code,
  Database,
  Globe,
  Heart,
  Star,
  Zap,
} from 'lucide-vue-next';

// Basic tabs
const basicTab = ref('account');

// Vertical tabs
const verticalTab = ref('profile');

// Tabs with icons
const iconTab = ref('notifications');

// Dynamic tabs
const dynamicTabs = ref([
  { id: 'tab1', label: 'Tab 1', content: 'Content for Tab 1' },
  { id: 'tab2', label: 'Tab 2', content: 'Content for Tab 2' },
  { id: 'tab3', label: 'Tab 3', content: 'Content for Tab 3' },
]);
const activeDynamicTab = ref('tab1');

const addTab = () => {
  const newId = `tab${dynamicTabs.value.length + 1}`;
  dynamicTabs.value.push({
    id: newId,
    label: `Tab ${dynamicTabs.value.length + 1}`,
    content: `Content for Tab ${dynamicTabs.value.length + 1}`,
  });
  activeDynamicTab.value = newId;
};

const removeTab = (tabId: string) => {
  const index = dynamicTabs.value.findIndex((tab) => tab.id === tabId);
  if (index > -1) {
    dynamicTabs.value.splice(index, 1);
    if (activeDynamicTab.value === tabId) {
      activeDynamicTab.value = dynamicTabs.value[0]?.id || '';
    }
  }
};

// Styled tabs
const styledTab = ref('design');

// Tabs with badges
const badgeTab = ref('messages');
const messageCount = ref(3);
const notificationCount = ref(12);
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-2">
      <h2 class="text-2xl font-semibold">Tabs</h2>
      <p class="text-muted-foreground">
        A set of layered sections of content—known as tab panels—that are displayed one at a time.
      </p>
    </div>

    <!-- Basic Tabs -->
    <div class="space-y-3">
      <h3 class="text-lg font-medium">Basic Tabs</h3>
      <p class="text-sm text-muted-foreground">Simple horizontal tabs with default styling.</p>
      <Tabs v-model="basicTab" class="w-full max-w-2xl">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="account" class="mt-4 p-4 border rounded-md">
          <div class="space-y-2">
            <h4 class="font-medium">Account Information</h4>
            <p class="text-sm text-muted-foreground">
              Manage your account settings and preferences here.
            </p>
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <User class="w-4 h-4" />
                <span class="text-sm">john.doe@example.com</span>
              </div>
              <div class="flex items-center gap-2">
                <Shield class="w-4 h-4" />
                <span class="text-sm">Verified Account</span>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="password" class="mt-4 p-4 border rounded-md">
          <div class="space-y-2">
            <h4 class="font-medium">Password Settings</h4>
            <p class="text-sm text-muted-foreground">Update your password and security settings.</p>
            <div class="space-y-2">
              <div class="text-sm">Last changed: 30 days ago</div>
              <Button size="sm">Change Password</Button>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="settings" class="mt-4 p-4 border rounded-md">
          <div class="space-y-2">
            <h4 class="font-medium">General Settings</h4>
            <p class="text-sm text-muted-foreground">Configure your application preferences.</p>
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <Settings class="w-4 h-4" />
                <span class="text-sm">Theme: Light</span>
              </div>
              <div class="flex items-center gap-2">
                <Globe class="w-4 h-4" />
                <span class="text-sm">Language: English</span>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>

    <!-- Tabs with Icons -->
    <div class="space-y-3">
      <h3 class="text-lg font-medium">Tabs with Icons</h3>
      <p class="text-sm text-muted-foreground">Tabs with icons for better visual hierarchy.</p>
      <Tabs v-model="iconTab" class="w-full max-w-2xl">
        <TabsList>
          <TabsTrigger value="notifications" class="flex items-center gap-2">
            <Bell class="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" class="flex items-center gap-2">
            <Palette class="w-4 h-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="developer" class="flex items-center gap-2">
            <Code class="w-4 h-4" />
            Developer
          </TabsTrigger>
        </TabsList>
        <TabsContent value="notifications" class="mt-4 p-4 border rounded-md">
          <div class="space-y-2">
            <h4 class="font-medium">Notification Preferences</h4>
            <p class="text-sm text-muted-foreground">
              Choose how you want to be notified about updates.
            </p>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-sm">Email notifications</span>
                <Button size="sm" variant="outline">Enable</Button>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm">Push notifications</span>
                <Button size="sm" variant="outline">Disable</Button>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="appearance" class="mt-4 p-4 border rounded-md">
          <div class="space-y-2">
            <h4 class="font-medium">Appearance Settings</h4>
            <p class="text-sm text-muted-foreground">
              Customize the look and feel of your interface.
            </p>
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <Palette class="w-4 h-4" />
                <span class="text-sm">Theme: System</span>
              </div>
              <div class="flex items-center gap-2">
                <Zap class="w-4 h-4" />
                <span class="text-sm">Animations: Enabled</span>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="developer" class="mt-4 p-4 border rounded-md">
          <div class="space-y-2">
            <h4 class="font-medium">Developer Options</h4>
            <p class="text-sm text-muted-foreground">
              Advanced settings for developers and power users.
            </p>
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <Code class="w-4 h-4" />
                <span class="text-sm">Debug mode: Off</span>
              </div>
              <div class="flex items-center gap-2">
                <Database class="w-4 h-4" />
                <span class="text-sm">API version: v2.1</span>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>

    <!-- Tabs with Badges -->
    <div class="space-y-3">
      <h3 class="text-lg font-medium">Tabs with Badges</h3>
      <p class="text-sm text-muted-foreground">
        Tabs with notification badges to show counts or status.
      </p>
      <Tabs v-model="badgeTab" class="w-full max-w-2xl">
        <TabsList>
          <TabsTrigger value="messages" class="flex items-center gap-2">
            Messages
            <span
              v-if="messageCount > 0"
              class="bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center"
            >
              {{ messageCount }}
            </span>
          </TabsTrigger>
          <TabsTrigger value="notifications" class="flex items-center gap-2">
            Notifications
          </TabsTrigger>
          <TabsTrigger value="favorites" class="flex items-center gap-2">
            <Heart class="w-4 h-4" />
            Favorites
          </TabsTrigger>
        </TabsList>
        <TabsContent value="messages" class="mt-4 p-4 border rounded-md">
          <div class="space-y-2">
            <h4 class="font-medium">Messages</h4>
            <p class="text-sm text-muted-foreground">
              You have {{ messageCount }} unread messages.
            </p>
            <Button size="sm" @click="messageCount = 0">Mark all as read</Button>
          </div>
        </TabsContent>
        <TabsContent value="notifications" class="mt-4 p-4 border rounded-md">
          <div class="space-y-2">
            <h4 class="font-medium">Notifications</h4>
            <p class="text-sm text-muted-foreground">
              You have {{ notificationCount }} unread notifications.
            </p>
            <Button size="sm" @click="notificationCount = 0">Clear all</Button>
          </div>
        </TabsContent>
        <TabsContent value="favorites" class="mt-4 p-4 border rounded-md">
          <div class="space-y-2">
            <h4 class="font-medium">Favorites</h4>
            <p class="text-sm text-muted-foreground">Your favorite items and bookmarks.</p>
            <div class="flex items-center gap-2">
              <Star class="w-4 h-4 text-yellow-500" />
              <span class="text-sm">5 starred items</span>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  </div>
</template>
