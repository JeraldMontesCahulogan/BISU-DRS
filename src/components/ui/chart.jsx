import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = {
  light: "",
  dark: ".dark",
};

const ChartContext = React.createContext(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

function ChartContainer({ id, className, children, config, ...props }) {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config, chartId }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          // Axis ticks use theme token
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground",
          // If Recharts uses default '#ccc' strokes, map them to theme
          "[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50",
          "[&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border/50",
          "[&_.recharts-reference-line_[stroke='#ccc']]:stroke-border/60",
          // Tooltip cursor uses theme tokens
          "[&_.recharts-curve.recharts-tooltip-cursor]:stroke-border/60",
          "[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted/50",
          // Background sectors
          "[&_.recharts-radial-bar-background-sector]:fill-muted",
          // Make dots/sectors not have white outlines (common in examples)
          "[&_.recharts-dot[stroke='#fff']]:stroke-transparent",
          "[&_.recharts-sector[stroke='#fff']]:stroke-transparent",
          // Remove outlines
          "[&_.recharts-layer]:outline-hidden",
          "[&_.recharts-sector]:outline-hidden",
          "[&_.recharts-surface]:outline-hidden",
          // Layout
          "flex aspect-video justify-center text-xs",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

const ChartStyle = ({ id, config }) => {
  const colorConfig = Object.entries(config).filter(
    ([, cfg]) => cfg.theme || cfg.color,
  );

  if (!colorConfig.length) return null;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color = itemConfig.theme?.[theme] || itemConfig.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .filter(Boolean)
  .join("\n")}
}
`,
          )
          .join("\n"),
      }}
    />
  );
};

const ChartTooltip = RechartsPrimitive.Tooltip;

/**
 * Helper: return a safe CSS var like `var(--color-atRisk)` for a series key
 */
function seriesVar(key) {
  return `var(--color-${key})`;
}

/**
 * Helper: determine best indicator color for tooltip/legend.
 * Priority:
 * 1) explicit `color` prop passed to tooltip
 * 2) item.color (recharts)
 * 3) item.payload.fill / item.payload.stroke (common)
 * 4) fallback to CSS var from config key
 */
function getIndicatorColor({ color, item, key }) {
  const p = item?.payload || {};
  return color || item?.color || p?.fill || p?.stroke || seriesVar(key);
}

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}) {
  const { config } = useChart();

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) return null;

    const [item] = payload;
    const key = `${labelKey || item?.dataKey || item?.name || "value"}`;
    const itemConfig = getPayloadConfigFromPayload(config, item, key);

    const value =
      !labelKey && typeof label === "string"
        ? config[label]?.label || label
        : itemConfig?.label;

    if (labelFormatter) {
      return (
        <div className={cn("font-medium", labelClassName)}>
          {labelFormatter(value, payload)}
        </div>
      );
    }

    if (!value) return null;

    return <div className={cn("font-medium", labelClassName)}>{value}</div>;
  }, [
    label,
    labelFormatter,
    payload,
    hideLabel,
    labelClassName,
    config,
    labelKey,
  ]);

  if (!active || !payload?.length) return null;

  const nestLabel = payload.length === 1 && indicator !== "dot";

  return (
    <div
      className={cn(
        "grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
        className,
      )}
    >
      {!nestLabel ? tooltipLabel : null}

      <div className="grid gap-1.5">
        {payload
          .filter((item) => item.type !== "none")
          .map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`;
            const itemConfig = getPayloadConfigFromPayload(config, item, key);

            const indicatorColor = getIndicatorColor({ color, item, key });

            return (
              <div
                key={item.dataKey ?? `${key}-${index}`}
                className={cn(
                  "[&>svg]:text-muted-foreground flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5",
                  indicator === "dot" && "items-center",
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)",
                            {
                              "h-2.5 w-2.5": indicator === "dot",
                              "w-1": indicator === "line",
                              "w-0 border-[1.5px] border-dashed bg-transparent":
                                indicator === "dashed",
                              "my-0.5": nestLabel && indicator === "dashed",
                            },
                          )}
                          style={{
                            "--color-bg": indicatorColor,
                            "--color-border": indicatorColor,
                          }}
                        />
                      )
                    )}

                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center",
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">
                          {itemConfig?.label || item.name}
                        </span>
                      </div>

                      {item.value !== undefined && item.value !== null ? (
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {Number(item.value).toLocaleString()}
                        </span>
                      ) : null}
                    </div>
                  </>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}

const ChartLegend = RechartsPrimitive.Legend;

function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = "bottom",
  nameKey,
}) {
  const { config } = useChart();

  if (!payload?.length) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className,
      )}
    >
      {payload
        .filter((item) => item.type !== "none")
        .map((item, index) => {
          const key = `${nameKey || item.dataKey || "value"}`;
          const itemConfig = getPayloadConfigFromPayload(config, item, key);

          // ✅ FIX: Recharts item.color can be undefined with CSS vars
          const swatchColor =
            item?.color ||
            item?.payload?.fill ||
            item?.payload?.stroke ||
            seriesVar(key);

          return (
            <div
              key={item.value ?? `${key}-${index}`}
              className={cn(
                "[&>svg]:text-muted-foreground flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3",
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: swatchColor }}
                />
              )}
              <span className="text-muted-foreground">
                {itemConfig?.label ?? item.value}
              </span>
            </div>
          );
        })}
    </div>
  );
}

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(config, payload, key) {
  if (typeof payload !== "object" || payload === null) return undefined;

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined;

  let configLabelKey = key;

  if (key in payload && typeof payload[key] === "string") {
    configLabelKey = payload[key];
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key] === "string"
  ) {
    configLabelKey = payloadPayload[key];
  }

  return configLabelKey in config ? config[configLabelKey] : config[key];
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
};

// import * as React from "react"
// import * as RechartsPrimitive from "recharts"

// import { cn } from "@/lib/utils"

// // Format: { THEME_NAME: CSS_SELECTOR }
// const THEMES = {
//   light: "",
//   dark: ".dark"
// }

// const ChartContext = React.createContext(null)

// function useChart() {
//   const context = React.useContext(ChartContext)

//   if (!context) {
//     throw new Error("useChart must be used within a <ChartContainer />")
//   }

//   return context
// }

// function ChartContainer({
//   id,
//   className,
//   children,
//   config,
//   ...props
// }) {
//   const uniqueId = React.useId()
//   const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

//   return (
//     <ChartContext.Provider value={{ config }}>
//       <div
//         data-slot="chart"
//         data-chart={chartId}
//         className={cn(
//           "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border flex aspect-video justify-center text-xs [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
//           className
//         )}
//         {...props}>
//         <ChartStyle id={chartId} config={config} />
//         <RechartsPrimitive.ResponsiveContainer>
//           {children}
//         </RechartsPrimitive.ResponsiveContainer>
//       </div>
//     </ChartContext.Provider>
//   );
// }

// const ChartStyle = ({
//   id,
//   config
// }) => {
//   const colorConfig = Object.entries(config).filter(([, config]) => config.theme || config.color)

//   if (!colorConfig.length) {
//     return null
//   }

//   return (
//     <style
//       dangerouslySetInnerHTML={{
//         __html: Object.entries(THEMES)
//           .map(([theme, prefix]) => `
// ${prefix} [data-chart=${id}] {
// ${colorConfig
// .map(([key, itemConfig]) => {
// const color =
//   itemConfig.theme?.[theme] ||
//   itemConfig.color
// return color ? `  --color-${key}: ${color};` : null
// })
// .join("\n")}
// }
// `)
//           .join("\n"),
//       }} />
//   );
// }

// const ChartTooltip = RechartsPrimitive.Tooltip

// function ChartTooltipContent({
//   active,
//   payload,
//   className,
//   indicator = "dot",
//   hideLabel = false,
//   hideIndicator = false,
//   label,
//   labelFormatter,
//   labelClassName,
//   formatter,
//   color,
//   nameKey,
//   labelKey
// }) {
//   const { config } = useChart()

//   const tooltipLabel = React.useMemo(() => {
//     if (hideLabel || !payload?.length) {
//       return null
//     }

//     const [item] = payload
//     const key = `${labelKey || item?.dataKey || item?.name || "value"}`
//     const itemConfig = getPayloadConfigFromPayload(config, item, key)
//     const value =
//       !labelKey && typeof label === "string"
//         ? config[label]?.label || label
//         : itemConfig?.label

//     if (labelFormatter) {
//       return (
//         <div className={cn("font-medium", labelClassName)}>
//           {labelFormatter(value, payload)}
//         </div>
//       );
//     }

//     if (!value) {
//       return null
//     }

//     return <div className={cn("font-medium", labelClassName)}>{value}</div>;
//   }, [
//     label,
//     labelFormatter,
//     payload,
//     hideLabel,
//     labelClassName,
//     config,
//     labelKey,
//   ])

//   if (!active || !payload?.length) {
//     return null
//   }

//   const nestLabel = payload.length === 1 && indicator !== "dot"

//   return (
//     <div
//       className={cn(
//         "border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl",
//         className
//       )}>
//       {!nestLabel ? tooltipLabel : null}
//       <div className="grid gap-1.5">
//         {payload
//           .filter((item) => item.type !== "none")
//           .map((item, index) => {
//             const key = `${nameKey || item.name || item.dataKey || "value"}`
//             const itemConfig = getPayloadConfigFromPayload(config, item, key)
//             const indicatorColor = color || item.payload.fill || item.color

//             return (
//               <div
//                 key={item.dataKey}
//                 className={cn(
//                   "[&>svg]:text-muted-foreground flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5",
//                   indicator === "dot" && "items-center"
//                 )}>
//                 {formatter && item?.value !== undefined && item.name ? (
//                   formatter(item.value, item.name, item, index, item.payload)
//                 ) : (
//                   <>
//                     {itemConfig?.icon ? (
//                       <itemConfig.icon />
//                     ) : (
//                       !hideIndicator && (
//                         <div
//                           className={cn("shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)", {
//                             "h-2.5 w-2.5": indicator === "dot",
//                             "w-1": indicator === "line",
//                             "w-0 border-[1.5px] border-dashed bg-transparent":
//                               indicator === "dashed",
//                             "my-0.5": nestLabel && indicator === "dashed",
//                           })}
//                           style={
//                             {
//                               "--color-bg": indicatorColor,
//                               "--color-border": indicatorColor
//                             }
//                           } />
//                       )
//                     )}
//                     <div
//                       className={cn(
//                         "flex flex-1 justify-between leading-none",
//                         nestLabel ? "items-end" : "items-center"
//                       )}>
//                       <div className="grid gap-1.5">
//                         {nestLabel ? tooltipLabel : null}
//                         <span className="text-muted-foreground">
//                           {itemConfig?.label || item.name}
//                         </span>
//                       </div>
//                       {item.value && (
//                         <span className="text-foreground font-mono font-medium tabular-nums">
//                           {item.value.toLocaleString()}
//                         </span>
//                       )}
//                     </div>
//                   </>
//                 )}
//               </div>
//             );
//           })}
//       </div>
//     </div>
//   );
// }

// const ChartLegend = RechartsPrimitive.Legend

// function ChartLegendContent({
//   className,
//   hideIcon = false,
//   payload,
//   verticalAlign = "bottom",
//   nameKey
// }) {
//   const { config } = useChart()

//   if (!payload?.length) {
//     return null
//   }

//   return (
//     <div
//       className={cn(
//         "flex items-center justify-center gap-4",
//         verticalAlign === "top" ? "pb-3" : "pt-3",
//         className
//       )}>
//       {payload
//         .filter((item) => item.type !== "none")
//         .map((item) => {
//           const key = `${nameKey || item.dataKey || "value"}`
//           const itemConfig = getPayloadConfigFromPayload(config, item, key)

//           return (
//             <div
//               key={item.value}
//               className={cn(
//                 "[&>svg]:text-muted-foreground flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3"
//               )}>
//               {itemConfig?.icon && !hideIcon ? (
//                 <itemConfig.icon />
//               ) : (
//                 <div
//                   className="h-2 w-2 shrink-0 rounded-[2px]"
//                   style={{
//                     backgroundColor: item.color,
//                   }} />
//               )}
//               {itemConfig?.label}
//             </div>
//           );
//         })}
//     </div>
//   );
// }

// // Helper to extract item config from a payload.
// function getPayloadConfigFromPayload(
//   config,
//   payload,
//   key
// ) {
//   if (typeof payload !== "object" || payload === null) {
//     return undefined
//   }

//   const payloadPayload =
//     "payload" in payload &&
//     typeof payload.payload === "object" &&
//     payload.payload !== null
//       ? payload.payload
//       : undefined

//   let configLabelKey = key

//   if (
//     key in payload &&
//     typeof payload[key] === "string"
//   ) {
//     configLabelKey = payload[key]
//   } else if (
//     payloadPayload &&
//     key in payloadPayload &&
//     typeof payloadPayload[key] === "string"
//   ) {
//     configLabelKey = payloadPayload[key]
//   }

//   return configLabelKey in config
//     ? config[configLabelKey]
//     : config[key];
// }

// export {
//   ChartContainer,
//   ChartTooltip,
//   ChartTooltipContent,
//   ChartLegend,
//   ChartLegendContent,
//   ChartStyle,
// }
