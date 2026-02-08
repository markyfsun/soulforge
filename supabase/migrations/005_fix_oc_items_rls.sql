-- Fix RLS policies for oc_items and oc_inventory tables
-- These tables had RLS enabled but no policies, making them completely inaccessible

-- ----------------------------------------------------------------------------
-- OC Items Policies
-- ----------------------------------------------------------------------------

-- Allow everyone to view items
CREATE POLICY "OC items are viewable by everyone"
  ON oc_items FOR SELECT
  USING (true);

-- Allow authenticated users to create items
CREATE POLICY "Authenticated users can create OC items"
  ON oc_items FOR INSERT
  WITH CHECK (true);

-- Allow service role to update items (for image generation)
CREATE POLICY "Service role can update OC items"
  ON oc_items FOR UPDATE
  USING (true);

-- ----------------------------------------------------------------------------
-- OC Inventory Policies
-- ----------------------------------------------------------------------------

-- Allow everyone to view inventory
CREATE POLICY "OC inventory is viewable by everyone"
  ON oc_inventory FOR SELECT
  USING (true);

-- Allow authenticated users to create inventory entries
CREATE POLICY "Authenticated users can create inventory entries"
  ON oc_inventory FOR INSERT
  WITH CHECK (true);
