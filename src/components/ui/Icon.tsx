import { Beer, Bug, Castle, Check, ChevronDown, ChevronLeft, ChevronRight, CircleDot, CircleHelp, Church, Cog, Compass, Copy, Download, DoorOpen, Eye, EyeOff, Flag, Gem, Globe2, House, Landmark, Lightbulb, LocateFixed, LockKeyhole, Map, MapPin, Maximize2, Menu, Minus, Moon, Mountain, Package, Pencil, Pickaxe, Plus, Route, Search, Settings2, Ship, Shield, Shuffle, Skull, Sparkles, Sprout, Sun, TentTree, Trees, UserRound, Wheat, X, ScrollText, Ruler, Crosshair, Upload, LogIn, SlidersHorizontal, type LucideProps } from 'lucide-react'

const icons = { Beer, Bug, Castle, Check, ChevronDown, ChevronLeft, ChevronRight, CircleDot, CircleHelp, Church, Cog, Compass, Copy, Download, DoorOpen, Eye, EyeOff, Flag, Gem, Globe2, House, Landmark, Lightbulb, LocateFixed, LockKeyhole, Map, MapPin, Maximize2, Menu, Minus, Moon, Mountain, Package, Pencil, Pickaxe, Plus, Route, Search, Settings2, Ship, Shield, Shuffle, Skull, Sparkles, Sprout, Sun, TentTree, Trees, UserRound, Wheat, X, ScrollText, Ruler, Crosshair, Upload, LogIn, SlidersHorizontal }

export type IconName = keyof typeof icons

export function Icon({ name, ...props }: { name: IconName } & LucideProps) {
  const Component = icons[name]
  return <Component aria-hidden="true" {...props} />
}
