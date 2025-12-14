/**
 * Address Types
 * Reusable address structure for all entities
 */

export interface Address {
  street: string
  street2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface EmergencyContact {
  name: string
  relationship: string
  phone: string
  email?: string
}

export interface MedicalInfo {
  bloodType?: string
  allergies?: string[]
  medications?: string[]
  conditions?: string[]
  notes?: string
}

