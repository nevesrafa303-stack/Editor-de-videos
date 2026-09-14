-- Fonte da matriz de permissoes publicada em docs/permissions.md.
-- Uso: psql -d crm -tA -F'|' -f docs/gen_permissions.sql
select p.resource, p.action, p.description, p.is_phi,
  max(case when srp.role_code = 'owner'        then 1 else 0 end) as owner,
  max(case when srp.role_code = 'manager'      then 1 else 0 end) as manager,
  max(case when srp.role_code = 'professional' then 1 else 0 end) as professional,
  max(case when srp.role_code = 'reception'    then 1 else 0 end) as reception,
  max(case when srp.role_code = 'finance'      then 1 else 0 end) as finance
from permission p
left join system_role_permission srp on srp.permission_key = p.key
group by p.resource, p.action, p.description, p.is_phi, p.key
order by p.resource, p.action;
