ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS preferred_location text;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS service_unit text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'patients_preferred_location_check') THEN
    ALTER TABLE public.patients
      ADD CONSTRAINT patients_preferred_location_check
      CHECK (preferred_location IS NULL OR preferred_location IN ('Araruama', 'Cabo Frio', 'Copacabana'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointments_service_unit_check') THEN
    ALTER TABLE public.appointments
      ADD CONSTRAINT appointments_service_unit_check
      CHECK (service_unit IS NULL OR service_unit IN ('Araruama', 'Cabo Frio', 'Copacabana'));
  END IF;
END $$;
