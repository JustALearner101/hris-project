# Indonesian Statutory Compliance

This document provides a reference for the Indonesian statutory compliance configurations managed within the HRIS system. These values are designed as dynamic, database-configurable parameters to allow updates without code redeployment.

## PPh21 (Income Tax)
- **Tax Rates & PTKP (Penghasilan Tidak Kena Pajak)**: Tax brackets, PTKP values, and occupational expense (biaya jabatan) limits are managed via configuration tables per period.
- **Capabilities**: Supports gross, gross-up, and nett tax calculation schemes.

## BPJS (Social Security)
- **BPJS Kesehatan (Health) & BPJS Ketenagakerjaan (Employment)**: Configuration covers all required components including JKK (Work Accident), JKM (Death), JHT (Old Age), and JP (Pension).
- **Parameters**: Wage limits (caps), percentage rates, and rounding rules are configurable per period.

## Overtime Calculation
- **Multiplier Coefficients**: Overtime formulas and their coefficient multipliers can be adjusted dynamically based on collective labor agreements (perjanjian kerja) and company regulations in compliance with Indonesian labor law.

## THR (Tunjangan Hari Raya)
- **Prorating Logic**: Rules regarding THR eligibility and prorating formulas based on the employee's length of service (measured in days or months) are fully configurable to align with religious holiday bonus requirements.
