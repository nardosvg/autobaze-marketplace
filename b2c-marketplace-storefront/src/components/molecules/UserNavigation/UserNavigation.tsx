"use client"
import {
  Badge,
  Card,
  Divider,
  LogoutButton,
  NavigationItem,
} from "@/components/atoms"
import { useUnreads } from "@talkjs/react"
import { usePathname } from "next/navigation"

const navigationItems = [
  {
    label: "Pedidos",
    href: "/user/orders",
  },
  {
    label: "Mensagens",
    href: "/user/messages",
  },
  {
    label: "Devoluções",
    href: "/user/returns",
  },
  {
    label: "Endereços",
    href: "/user/addresses",
  },
  {
    label: "Avaliações",
    href: "/user/reviews",
  },
  {
    label: "Favoritos",
    href: "/user/wishlist",
  },
]

export const UserNavigation = () => {
  const unreads = useUnreads()
  const path = usePathname()

  return (
    <Card className="h-min">
      {navigationItems.map((item) => (
        <NavigationItem
          key={item.label}
          href={item.href}
          active={path === item.href}
          className="relative"
        >
          {item.label}
          {item.label === "Messages" && Boolean(unreads?.length) && (
            <Badge className="absolute top-3 left-24 w-4 h-4 p-0">
              {unreads?.length}
            </Badge>
          )}
        </NavigationItem>
      ))}
      <Divider className="my-2" />
      <NavigationItem
        href={"/user/settings"}
        active={path === "/user/settings"}
      >
        Configurações
      </NavigationItem>
      <LogoutButton className="w-full text-left" />
    </Card>
  )
}
