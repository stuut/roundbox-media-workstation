import { z } from "zod";

const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const BaseElementSchema = z.object({
  id: z.string(),
  role: z.string().optional(),
  position: PositionSchema,
  zIndex: z.number().optional(),
});

const TextElementSchema = BaseElementSchema.extend({
  type: z.literal("text"),
  content: z.string(),
  font: z.object({
    family: z.string(),
    size: z.number(),
    weight: z.number().optional(),
    lineHeight: z.number().optional(),
  }),
  color: z.string().optional(),
  maxWidth: z.number().optional(),
});

const ImageElementSchema = BaseElementSchema.extend({
  type: z.literal("image"),
  assetQuery: z.string(),
  fit: z.enum(["cover", "contain"]),
  size: z.enum(["full", "custom"]),
  width: z.number().optional(),
  height: z.number().optional(),
});

const ShapeElementSchema = BaseElementSchema.extend({
  type: z.literal("shape"),
  shape: z.enum(["rect", "circle"]),
  width: z.number(),
  height: z.number(),
  color: z.string(),
});

const ButtonElementSchema = BaseElementSchema.extend({
  type: z.literal("button"),
  text: z.string(),
  style: z.enum(["primary", "secondary"]),
});

export const DesignSchema = z.object({
  canvas: z.object({
    width: z.number(),
    height: z.number(),
    format: z.enum(["square", "portrait", "landscape", "custom"]),
  }),

  style: z.object({
    fontProvider: z.literal("google_fonts"),
    allowedFonts: z.array(z.string()),
    colorPalette: z.array(z.string()),
  }),

  elements: z.array(
    z.union([
      TextElementSchema,
      ImageElementSchema,
      ShapeElementSchema,
      ButtonElementSchema,
    ])
  ),
});
