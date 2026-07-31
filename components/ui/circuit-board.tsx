"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface CircuitNode {
  id: string
  x: number
  y: number
  label?: string
  icon?: React.ReactNode
  status?: "active" | "inactive" | "processing" | "error"
  size?: "sm" | "md" | "lg"
}

interface CircuitConnection {
  from: string
  to: string
  animated?: boolean
  bidirectional?: boolean
  color?: string
  pulseColor?: string
}

interface CircuitBoardProps extends React.HTMLAttributes<HTMLDivElement> {
  nodes: CircuitNode[]
  connections: CircuitConnection[]
  width?: number
  height?: number
  viewBox?: string
  gridSize?: number
  showGrid?: boolean
  gridColor?: string
  traceColor?: string
  pulseColor?: string
  nodeColor?: string
  pulseSpeed?: number
  traceWidth?: number
  /** Force a specific theme variant. Defaults to auto-detect from system. */
  variant?: "light" | "dark" | "auto"
}

function CircuitBoard({
  nodes,
  connections,
  width = 600,
  height = 400,
  viewBox,
  gridSize = 20,
  showGrid = true,
  gridColor,
  traceColor,
  pulseColor,
  nodeColor,
  pulseSpeed = 2,
  traceWidth = 1.5,
  variant = "auto",
  className,
  ...props
}: CircuitBoardProps) {
  const [isDark, setIsDark] = React.useState(true)

  React.useEffect(() => {
    if (variant !== "auto") {
      setIsDark(variant === "dark")
      return
    }
    const checkTheme = () => {
      const isDarkMode =
        document.documentElement.classList.contains("dark") ||
        document.body.classList.contains("dark")
      setIsDark(isDarkMode)
    }
    checkTheme()
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    })
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    mediaQuery.addEventListener("change", checkTheme)
    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener("change", checkTheme)
    }
  }, [variant])

  const computedGridColor =
    gridColor || (isDark ? "rgba(163,163,163,0.06)" : "rgba(64,64,64,0.08)")
  const computedTraceColor =
    traceColor || (isDark ? "rgba(163,163,163,0.22)" : "rgba(64,64,64,0.3)")
  const computedPulseColor =
    pulseColor || (isDark ? "rgba(163,163,163,0.55)" : "rgba(64,64,64,0.6)")
  const computedNodeColor =
    nodeColor || (isDark ? "rgba(163,163,163,0.45)" : "rgba(64,64,64,0.55)")

  const nodeMap = React.useMemo(
    () => new Map(nodes.map((n) => [n.id, n])),
    [nodes]
  )

  const getNodeSize = React.useCallback((size?: CircuitNode["size"]) => {
    switch (size) {
      case "sm":
        return 28
      case "lg":
        return 48
      default:
        return 36
    }
  }, [])

  /* ── Curved bezier path calculation ── */
  const r2 = (n: number) => Math.round(n * 100) / 100

  const calculatePath = React.useCallback(
    (from: CircuitNode, to: CircuitNode): string => {
      const fromR = getNodeSize(from.size) / 2
      const toR = getNodeSize(to.size) / 2
      const dx = to.x - from.x
      const dy = to.y - from.y
      const angle = Math.atan2(dy, dx)
      const dist = Math.sqrt(dx * dx + dy * dy)

      /* Start/end at node edges */
      const sx = r2(from.x + Math.cos(angle) * (fromR + 2))
      const sy = r2(from.y + Math.sin(angle) * (fromR + 2))
      const ex = r2(to.x - Math.cos(angle) * (toR + 2))
      const ey = r2(to.y - Math.sin(angle) * (toR + 2))

      const mx = r2((sx + ex) / 2)
      const my = r2((sy + ey) / 2)

      /* Direction vector (normalized) */
      const ux = dx / dist
      const uy = dy / dist
      /* Perpendicular vector */
      const px = -uy
      const py = ux

      /* Decide curve tightness based on how diagonal the connection is */
      const diagRatio = Math.min(Math.abs(dx), Math.abs(dy)) / (dist || 1)
      /* diagRatio ≈ 0 for pure H/V, ≈ 0.7 for 45° */
      const tightness = 0.03 + diagRatio * 0.07
      const bulge = dist * tightness

      /* Control points: offset along the flow direction, with a small perpendicular nudge
         to separate overlapping edges when a node fans out to multiple targets.
         The perpendicular component is proportional to how far off-center the
         target is relative to the source → target midline. */
      const offCenter = (dy * ux - dx * uy) / (dist || 1) /* cross product = lateral offset */
      const lateralNudge = offCenter * dist * 0.04

      const cx1 = r2(sx + (mx - sx) * 0.6 + px * (bulge * 0.4 + lateralNudge))
      const cy1 = r2(sy + (my - sy) * 0.6 + py * (bulge * 0.4 + lateralNudge))
      const cx2 = r2(mx + (ex - mx) * 0.4 + px * (bulge * 0.2 + lateralNudge * 0.5))
      const cy2 = r2(my + (ey - my) * 0.4 + py * (bulge * 0.2 + lateralNudge * 0.5))

      return `M ${sx} ${sy} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${ex} ${ey}`
    },
    [getNodeSize]
  )

  /* ── Arrowhead marker ── */
  const getArrowId = (i: number) => `arrow-${i}`

  const getStatusColors = React.useCallback(
    (status?: CircuitNode["status"]) => {
      if (isDark) {
        switch (status) {
          case "active":
            return {
              fill: "rgba(163,163,163,0.12)",
              stroke: "rgba(163,163,163,0.55)",
              icon: "rgba(163,163,163,0.85)",
              glow: "rgba(163,163,163,0.25)",
            }
          case "processing":
            return {
              fill: "rgba(163,163,163,0.08)",
              stroke: "rgba(163,163,163,0.4)",
              icon: "rgba(163,163,163,0.7)",
              glow: "rgba(163,163,163,0.2)",
            }
          case "error":
            return {
              fill: "rgba(180,83,83,0.1)",
              stroke: "rgba(180,83,83,0.6)",
              icon: "rgba(180,83,83,0.8)",
              glow: "rgba(180,83,83,0.3)",
            }
          default:
            return {
              fill: "rgba(163,163,163,0.06)",
              stroke: "rgba(163,163,163,0.3)",
              icon: "rgba(163,163,163,0.6)",
              glow: "rgba(163,163,163,0.15)",
            }
        }
      }
      switch (status) {
        case "active":
          return {
            fill: "rgba(64,64,64,0.06)",
            stroke: "rgba(64,64,64,0.55)",
            icon: "rgba(64,64,64,0.8)",
            glow: "rgba(64,64,64,0.18)",
          }
        case "processing":
          return {
            fill: "rgba(64,64,64,0.04)",
            stroke: "rgba(64,64,64,0.4)",
            icon: "rgba(64,64,64,0.65)",
            glow: "rgba(64,64,64,0.12)",
          }
        case "error":
          return {
            fill: "rgba(180,83,83,0.08)",
            stroke: "rgba(180,83,83,0.55)",
            icon: "rgba(180,83,83,0.8)",
            glow: "rgba(180,83,83,0.25)",
          }
        default:
          return {
            fill: "rgba(64,64,64,0.03)",
            stroke: "rgba(64,64,64,0.28)",
            icon: "rgba(64,64,64,0.55)",
            glow: "rgba(64,64,64,0.1)",
          }
      }
    },
    [isDark]
  )

  return (
    <div
      className={cn("relative h-full w-full", className)}
      {...props}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={viewBox || `0 0 ${width} ${height}`}
        className="absolute inset-0"
        style={{ overflow: "visible" }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="nodeShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.08" />
          </filter>

          {showGrid && (
            <pattern
              id="circuitGrid"
              width={gridSize}
              height={gridSize}
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx={gridSize / 2}
                cy={gridSize / 2}
                r="0.4"
                fill={computedGridColor}
              />
            </pattern>
          )}

          {connections.map((conn, i) => (
            <marker
              key={`marker-${i}`}
              id={getArrowId(i)}
              viewBox="0 0 8 6"
              refX="7"
              refY="3"
              markerWidth="6"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path
                d="M 0 0 L 8 3 L 0 6 Z"
                fill={conn.color || computedTraceColor}
                opacity="0.7"
              />
            </marker>
          ))}

          {connections.map((conn, i) => (
            <linearGradient
              key={`grad-${i}`}
              id={`pulseGrad-${i}`}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="transparent" />
              <stop offset="40%" stopColor="transparent" />
              <stop
                offset="50%"
                stopColor={conn.pulseColor || computedPulseColor}
              />
              <stop offset="60%" stopColor="transparent" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          ))}
        </defs>

        {showGrid && (
          <rect width={width} height={height} fill="url(#circuitGrid)" />
        )}

        {connections.map((conn, i) => {
          const fromNode = nodeMap.get(conn.from)
          const toNode = nodeMap.get(conn.to)
          if (!fromNode || !toNode) return null

          const path = calculatePath(fromNode, toNode)
          const pathLength = 600

          return (
            <g key={`conn-${i}`}>
              <motion.path
                d={path}
                fill="none"
                stroke={conn.color || computedTraceColor}
                strokeWidth={traceWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                markerEnd={`url(#${getArrowId(i)})`}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: i * 0.12, ease: "easeOut" }}
              />

              {conn.animated !== false && (
                <motion.path
                  d={path}
                  fill="none"
                  stroke={conn.pulseColor || computedPulseColor}
                  strokeWidth={traceWidth + 1.5}
                  strokeLinecap="round"
                  filter="url(#softGlow)"
                  strokeDasharray={`${pathLength * 0.08} ${pathLength * 0.92}`}
                  initial={{ strokeDashoffset: pathLength }}
                  animate={{ strokeDashoffset: -pathLength }}
                  transition={{
                    duration: pulseSpeed,
                    repeat: Infinity,
                    ease: "linear",
                    delay: i * 0.25,
                  }}
                />
              )}

              {conn.bidirectional && (
                <motion.path
                  d={path}
                  fill="none"
                  stroke={conn.pulseColor || computedPulseColor}
                  strokeWidth={traceWidth + 1.5}
                  strokeLinecap="round"
                  filter="url(#softGlow)"
                  strokeDasharray={`${pathLength * 0.08} ${pathLength * 0.92}`}
                  initial={{ strokeDashoffset: -pathLength }}
                  animate={{ strokeDashoffset: pathLength }}
                  transition={{
                    duration: pulseSpeed,
                    repeat: Infinity,
                    ease: "linear",
                    delay: i * 0.25 + pulseSpeed / 2,
                  }}
                />
              )}
            </g>
          )
        })}
      </svg>

      {nodes.map((node, i) => {
        const size = getNodeSize(node.size)
        const colors = getStatusColors(node.status)
        const isSmall = node.size === "sm"
        const isLarge = node.size === "lg"

        return (
          <motion.div
            key={node.id}
            className="absolute"
            style={{
              left: node.x - size / 2,
              top: node.y - size / 2,
              width: size,
              height: size,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: i * 0.08 + 0.4,
              type: "spring",
              stiffness: 260,
              damping: 20,
            }}
          >
            {/* Outer glow ring for active/processing */}
            {(node.status === "active" || node.status === "processing") && (
              <motion.div
                className="absolute rounded-xl"
                style={{
                  inset: -3,
                  background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
                }}
                animate={
                  node.status === "processing"
                    ? { opacity: [0.4, 0.8, 0.4], scale: [1, 1.05, 1] }
                    : { opacity: 0.5 }
                }
                transition={
                  node.status === "processing"
                    ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    : {}
                }
              />
            )}

            {/* Node body */}
            <div
              className="relative flex items-center justify-center rounded-xl border"
              style={{
                width: size,
                height: size,
                backgroundColor: colors.fill,
                borderColor: colors.stroke,
                boxShadow: `0 1px 3px ${colors.glow}, inset 0 1px 0 rgba(255,255,255,0.04)`,
              }}
            >
              {/* Processing pulse overlay */}
              {node.status === "processing" && (
                <motion.div
                  className="absolute inset-0 rounded-xl"
                  style={{ backgroundColor: colors.stroke }}
                  animate={{ opacity: [0.05, 0.15, 0.05] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                />
              )}

              {/* Icon */}
              {node.icon && (
                <div className="relative z-10" style={{ color: colors.icon }}>
                  {node.icon}
                </div>
              )}

              {/* Inline label for lg nodes */}
              {node.label && isLarge && (
                <div
                  className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[9px] font-medium tracking-wide uppercase"
                  style={{
                    color: colors.icon,
                    backgroundColor: colors.fill,
                    border: `1px solid ${colors.stroke}`,
                  }}
                >
                  {node.label}
                </div>
              )}
            </div>

            {/* External label for non-lg nodes */}
            {node.label && !isLarge && (
              <div
                className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-medium tracking-wide"
                style={{
                  top: size + 4,
                  color: colors.icon,
                  opacity: 0.8,
                }}
              >
                {node.label}
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

/* ── Pre-built circuit patterns ── */
interface CircuitPatternProps
  extends Omit<CircuitBoardProps, "nodes" | "connections"> {
  pattern: "data-flow" | "network" | "processor" | "tree"
}

function CircuitPattern({ pattern, ...props }: CircuitPatternProps) {
  const patterns = {
    "data-flow": {
      nodes: [
        { id: "input", x: 50, y: 200, label: "Input", status: "active" as const },
        { id: "process1", x: 200, y: 100, label: "Process", status: "processing" as const },
        { id: "process2", x: 200, y: 300, label: "Validate", status: "active" as const },
        { id: "merge", x: 400, y: 200, label: "Merge", status: "active" as const },
        { id: "output", x: 550, y: 200, label: "Output", status: "active" as const },
      ],
      connections: [
        { from: "input", to: "process1", animated: true },
        { from: "input", to: "process2", animated: true },
        { from: "process1", to: "merge", animated: true },
        { from: "process2", to: "merge", animated: true },
        { from: "merge", to: "output", animated: true },
      ],
    },
    network: {
      nodes: [
        { id: "server", x: 300, y: 80, label: "Server", status: "active" as const, size: "lg" as const },
        { id: "client1", x: 100, y: 200, label: "Client 1", status: "active" as const },
        { id: "client2", x: 300, y: 250, label: "Client 2", status: "processing" as const },
        { id: "client3", x: 500, y: 200, label: "Client 3", status: "active" as const },
        { id: "db", x: 300, y: 350, label: "Database", status: "active" as const },
      ],
      connections: [
        { from: "server", to: "client1", bidirectional: true },
        { from: "server", to: "client2", bidirectional: true },
        { from: "server", to: "client3", bidirectional: true },
        { from: "server", to: "db", bidirectional: true },
      ],
    },
    processor: {
      nodes: [
        { id: "alu", x: 300, y: 200, label: "ALU", status: "processing" as const, size: "lg" as const },
        { id: "reg1", x: 150, y: 100, label: "R1", status: "active" as const, size: "sm" as const },
        { id: "reg2", x: 150, y: 200, label: "R2", status: "active" as const, size: "sm" as const },
        { id: "reg3", x: 150, y: 300, label: "R3", status: "active" as const, size: "sm" as const },
        { id: "cache", x: 450, y: 200, label: "Cache", status: "active" as const },
        { id: "out", x: 550, y: 200, label: "Out", status: "active" as const, size: "sm" as const },
      ],
      connections: [
        { from: "reg1", to: "alu", animated: true },
        { from: "reg2", to: "alu", animated: true },
        { from: "reg3", to: "alu", animated: true },
        { from: "alu", to: "cache", animated: true },
        { from: "cache", to: "out", animated: true },
      ],
    },
    tree: {
      nodes: [
        { id: "root", x: 300, y: 50, label: "Root", status: "active" as const },
        { id: "l1", x: 150, y: 150, label: "L1", status: "active" as const },
        { id: "r1", x: 450, y: 150, label: "R1", status: "processing" as const },
        { id: "l1l", x: 80, y: 280, label: "L1L", status: "active" as const, size: "sm" as const },
        { id: "l1r", x: 220, y: 280, label: "L1R", status: "active" as const, size: "sm" as const },
        { id: "r1l", x: 380, y: 280, label: "R1L", status: "error" as const, size: "sm" as const },
        { id: "r1r", x: 520, y: 280, label: "R1R", status: "active" as const, size: "sm" as const },
      ],
      connections: [
        { from: "root", to: "l1", animated: true },
        { from: "root", to: "r1", animated: true },
        { from: "l1", to: "l1l", animated: true },
        { from: "l1", to: "l1r", animated: true },
        { from: "r1", to: "r1l", animated: true },
        { from: "r1", to: "r1r", animated: true },
      ],
    },
  }

  const selectedPattern = patterns[pattern]
  return (
    <CircuitBoard
      nodes={selectedPattern.nodes}
      connections={selectedPattern.connections}
      {...props}
    />
  )
}

/* ── Interactive circuit node ── */
interface CircuitNodeComponentProps {
  status?: "active" | "inactive" | "processing" | "error"
  size?: "sm" | "md" | "lg"
  glowColor?: string
  children?: React.ReactNode
  className?: string
  onClick?: () => void
}

function CircuitNode({
  status = "inactive",
  size = "md",
  glowColor,
  children,
  className,
  onClick,
}: CircuitNodeComponentProps) {
  const [isDark, setIsDark] = React.useState(true)

  React.useEffect(() => {
    const checkTheme = () => {
      const isDarkMode =
        document.documentElement.classList.contains("dark") ||
        document.body.classList.contains("dark")
      setIsDark(isDarkMode)
    }
    checkTheme()
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    })
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    mediaQuery.addEventListener("change", checkTheme)
    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener("change", checkTheme)
    }
  }, [])

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  }

  const statusColors = isDark
    ? {
        active: "rgba(163,163,163,0.7)",
        inactive: "rgba(115,115,115,0.4)",
        processing: "rgba(163,163,163,0.5)",
        error: "rgba(180,83,83,0.6)",
      }
    : {
        active: "rgba(64,64,64,0.8)",
        inactive: "rgba(100,100,100,0.5)",
        processing: "rgba(64,64,64,0.6)",
        error: "rgba(180,83,83,0.7)",
      }

  const color = glowColor || statusColors[status]

  return (
    <motion.div
      className={cn(
        "relative flex items-center justify-center rounded-xl border",
        isDark ? "bg-neutral-900/50" : "bg-neutral-200/60",
        sizeClasses[size],
        className
      )}
      style={{ borderColor: color }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      {status === "processing" && (
        <motion.div
          className="absolute inset-0 rounded-xl"
          style={{ backgroundColor: color }}
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
      {status === "active" && (
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            boxShadow: `0 0 16px ${color}50, 0 0 32px ${color}25`,
          }}
        />
      )}
      {status === "error" && (
        <motion.div
          className="absolute inset-0 rounded-xl"
          style={{ boxShadow: `0 0 16px ${color}70` }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      )}
      <div className="relative z-10" style={{ color }}>
        {children}
      </div>
    </motion.div>
  )
}

/* ── Animated trace line ── */
interface CircuitTraceProps {
  path: string
  animated?: boolean
  color?: string
  pulseColor?: string
  width?: number
  pulseSpeed?: number
}

function CircuitTrace({
  path,
  animated = true,
  color,
  pulseColor,
  width = 1.5,
  pulseSpeed = 2,
}: CircuitTraceProps) {
  const [isDark, setIsDark] = React.useState(true)

  React.useEffect(() => {
    const checkTheme = () => {
      const isDarkMode =
        document.documentElement.classList.contains("dark") ||
        document.body.classList.contains("dark")
      setIsDark(isDarkMode)
    }
    checkTheme()
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    })
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    mediaQuery.addEventListener("change", checkTheme)
    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener("change", checkTheme)
    }
  }, [])

  const computedColor =
    color || (isDark ? "rgba(163,163,163,0.22)" : "rgba(64,64,64,0.3)")
  const computedPulse =
    pulseColor || (isDark ? "rgba(163,163,163,0.55)" : "rgba(64,64,64,0.6)")
  const pathLength = 600

  return (
    <svg className="absolute inset-0 overflow-visible pointer-events-none">
      <defs>
        <filter id="traceGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <motion.path
        d={path}
        fill="none"
        stroke={computedColor}
        strokeWidth={width}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8 }}
      />
      {animated && (
        <motion.path
          d={path}
          fill="none"
          stroke={computedPulse}
          strokeWidth={width + 1.5}
          strokeLinecap="round"
          filter="url(#traceGlow)"
          strokeDasharray={`${pathLength * 0.08} ${pathLength * 0.92}`}
          initial={{ strokeDashoffset: pathLength }}
          animate={{ strokeDashoffset: -pathLength }}
          transition={{
            duration: pulseSpeed,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      )}
    </svg>
  )
}

export {
  CircuitBoard,
  CircuitPattern,
  CircuitNode,
  CircuitTrace,
  type CircuitNode as CircuitNodeType,
  type CircuitConnection,
  type CircuitBoardProps,
}
