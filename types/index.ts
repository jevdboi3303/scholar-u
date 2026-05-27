export interface Scholarship {
  id: string
  name: string
  scholarship_type: string | null
  application_required: boolean | null
  description: string | null
  quantity: string | null
  preference: string | null
  faculty: string | null
  gender: string | null
  year: string | null
  disability: boolean | null
  indigenous: boolean | null
  race: string | null
  nationality: string | null
  gpa: number | null
  amount: number | null
  gpa_based: boolean | null
  medals_prizes: boolean | null
  deadline: string | null
  deadline_text: string | null
  renewable: boolean | null
  source_url: string | null
  created_at: string
}

export interface SavedScholarship {
  id: string
  user_id: string
  scholarship_id: string
  notes: string | null
  status: 'saved' | 'applied' | 'awarded'
  created_at: string
  scholarship: Scholarship
}

export interface UserProfile {
  id: string
  name: string | null
  faculty: string | null
  year: string | null
  gpa: number | null
  gender: string | null
  nationality: string | null
  indigenous: boolean
  disability: boolean
  created_at: string
}

export interface ScholarshipFilters {
  query: string
  type: string
  faculty: string
  minGpa: string
  year: string
  applicationRequired: boolean | null
  renewable: boolean | null
  indigenous: boolean
  disability: boolean
}
