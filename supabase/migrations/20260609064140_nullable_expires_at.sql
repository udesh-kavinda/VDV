-- Make expires_at nullable (fuel pass and similar docs have no expiry)
alter table documents alter column expires_at drop not null;
alter table notification_log alter column expires_at_snapshot drop not null;
