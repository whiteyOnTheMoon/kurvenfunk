-- Add the new club color model while preserving existing data.
ALTER TABLE "Club"
ADD COLUMN "color1Hex" TEXT,
ADD COLUMN "color1Rgba" TEXT,
ADD COLUMN "color2Hex" TEXT,
ADD COLUMN "color2Rgba" TEXT,
ADD COLUMN "color3Hex" TEXT,
ADD COLUMN "color3Rgba" TEXT,
ADD COLUMN "accentColorHex" TEXT,
ADD COLUMN "accentColorRgba" TEXT;

-- Existing primary club color becomes required color 1.
UPDATE "Club"
SET
  "color1Hex" = "primaryColor",
  "color1Rgba" =
    'rgba(' ||
    get_byte(decode(substr("primaryColor", 2), 'hex'), 0) || ', ' ||
    get_byte(decode(substr("primaryColor", 2), 'hex'), 1) || ', ' ||
    get_byte(decode(substr("primaryColor", 2), 'hex'), 2) || ', 1)'
WHERE "primaryColor" IS NOT NULL;

-- Existing secondary club color becomes optional color 2.
UPDATE "Club"
SET
  "color2Hex" = "secondaryColor",
  "color2Rgba" =
    'rgba(' ||
    get_byte(decode(substr("secondaryColor", 2), 'hex'), 0) || ', ' ||
    get_byte(decode(substr("secondaryColor", 2), 'hex'), 1) || ', ' ||
    get_byte(decode(substr("secondaryColor", 2), 'hex'), 2) || ', 1)'
WHERE "secondaryColor" IS NOT NULL;

-- Color 3 is new and therefore starts empty.

-- Existing accent color remains the accent color, now with explicit HEX/RGBA storage.
UPDATE "Club"
SET
  "accentColorHex" = "accentColor",
  "accentColorRgba" =
    'rgba(' ||
    get_byte(decode(substr("accentColor", 2), 'hex'), 0) || ', ' ||
    get_byte(decode(substr("accentColor", 2), 'hex'), 1) || ', ' ||
    get_byte(decode(substr("accentColor", 2), 'hex'), 2) || ', 1)'
WHERE "accentColor" IS NOT NULL;

-- Every existing club currently has a primary color, so color 1 can now be required.
ALTER TABLE "Club"
ALTER COLUMN "color1Hex" SET NOT NULL,
ALTER COLUMN "color1Rgba" SET NOT NULL;

-- Optional colors must always contain either both representations or neither.
ALTER TABLE "Club"
ADD CONSTRAINT "Club_color2_pair_check"
CHECK (
  ("color2Hex" IS NULL AND "color2Rgba" IS NULL)
  OR
  ("color2Hex" IS NOT NULL AND "color2Rgba" IS NOT NULL)
),
ADD CONSTRAINT "Club_color3_pair_check"
CHECK (
  ("color3Hex" IS NULL AND "color3Rgba" IS NULL)
  OR
  ("color3Hex" IS NOT NULL AND "color3Rgba" IS NOT NULL)
),
ADD CONSTRAINT "Club_accent_color_pair_check"
CHECK (
  ("accentColorHex" IS NULL AND "accentColorRgba" IS NULL)
  OR
  ("accentColorHex" IS NOT NULL AND "accentColorRgba" IS NOT NULL)
);

ALTER TABLE "Club"
DROP COLUMN "primaryColor",
DROP COLUMN "secondaryColor",
DROP COLUMN "accentColor";
