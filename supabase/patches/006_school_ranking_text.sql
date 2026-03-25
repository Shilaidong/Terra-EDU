alter table if exists school_content_details
  alter column ranking type text using ranking::text;
