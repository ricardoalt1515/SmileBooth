"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "glass relative inline-flex h-12 w-fit items-center justify-center rounded-xl p-1 border border-white/10",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2",
        "text-sm font-medium text-white/60 whitespace-nowrap",
        "transition-all duration-300 ease-out",
        "hover:text-white/90 hover:bg-white/5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:text-white data-[state=active]:bg-primary/20",
        "data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "flex-1 outline-none",
        "data-[state=active]:animate-fade-in-up",
        className
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
