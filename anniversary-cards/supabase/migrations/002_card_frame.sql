-- Add TCG frame fields to the cards pool
-- Run in Supabase SQL Editor after 001_schema.sql

ALTER TABLE public.cards
  ADD COLUMN IF NOT EXISTS show_frame boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS frame_color text NOT NULL DEFAULT '#f5c451';
