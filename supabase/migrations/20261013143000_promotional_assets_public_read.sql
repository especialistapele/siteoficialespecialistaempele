-- Allow public reads of asset metadata only when attached to a currently visible campaign.
drop policy if exists promotional_assets_public_read_active on public.promotional_assets;
create policy promotional_assets_public_read_active on public.promotional_assets for select to anon,authenticated using (
 exists (
  select 1 from public.promotional_campaign_assets ca
  join public.promotional_campaigns c on c.id=ca.campaign_id
  where ca.asset_id=promotional_assets.id and c.active=true
   and (c.starts_at is null or c.starts_at<=now()) and (c.ends_at is null or c.ends_at>now())
 )
);
grant select on public.promotional_assets to anon,authenticated;
