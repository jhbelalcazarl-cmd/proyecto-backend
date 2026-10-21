CREATE TABLE IF NOT EXISTS countries (
  alpha2 TEXT PRIMARY KEY CHECK(length(alpha2) = 2),
  alpha3 TEXT NOT NULL UNIQUE CHECK(length(alpha3) = 3),
  numeric_code TEXT NOT NULL UNIQUE CHECK(length(numeric_code) = 3),
  name TEXT NOT NULL UNIQUE,
  continent TEXT NOT NULL,
  population INTEGER NOT NULL CHECK(population >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_countries_name ON countries(name);
CREATE INDEX IF NOT EXISTS idx_countries_continent ON countries(continent);
