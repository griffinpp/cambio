# Rhinozug
Rhinogram's internal database connection tool

This is the connection tool that rhinozug-CLI expects to be installed in a project when running up/down migrations for it.  It is a wrapper for Knex, MySql, and PostgreSql, and returns a Knex connection object.