/**
 * useEducationOrgs Hooks
 *
 * React Query hooks for all EdOrg data fetching and mutations.
 * Follows the query key factory pattern from useCourses.ts / useSchool.ts.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import type {
  CreateStateEducationAgencyDto,
  SeaResponseDto,
  CreateLocalEducationAgencyDto,
  UpdateLocalEducationAgencyDto,
  LeaResponseDto,
  LeaListResponseDto,
  LeaFilterDto,
  CreateEducationServiceCenterDto,
  UpdateEducationServiceCenterDto,
  EscResponseDto,
  EscListResponseDto,
  EscFilterDto,
  CreateEducationOrgNetworkDto,
  UpdateEducationOrgNetworkDto,
  NetworkResponseDto,
  NetworkListResponseDto,
  NetworkFilterDto,
  CreateNetworkAssociationDto,
  UpdateNetworkAssociationDto,
  NetworkAssociationResponseDto,
  NetworkAssociationListResponseDto,
  OrganizationHierarchyResponseDto,
} from '@aibrains/shared-types'
import {
  getStateEducationAgency,
  createOrUpdateStateEducationAgency,
  getLocalEducationAgencies,
  getLocalEducationAgency,
  createLocalEducationAgency,
  updateLocalEducationAgency,
  deleteLocalEducationAgency,
  getEducationServiceCenters,
  getEducationServiceCenter,
  createEducationServiceCenter,
  updateEducationServiceCenter,
  deleteEducationServiceCenter,
  getNetworks,
  getNetwork,
  createNetwork,
  updateNetwork,
  deleteNetwork,
  getNetworkMembers,
  addNetworkMember,
  updateNetworkMember,
  removeNetworkMember,
  getOrganizationHierarchy,
} from '../services/education-org.service'

// ============================================================================
// QUERY KEY FACTORY
// ============================================================================

export const edOrgKeys = {
  all: ['education-orgs'] as const,
  hierarchy: () => [...edOrgKeys.all, 'hierarchy'] as const,
  sea: () => [...edOrgKeys.all, 'sea'] as const,
  leas: () => [...edOrgKeys.all, 'leas'] as const,
  leaList: (filters?: Partial<LeaFilterDto>) => [...edOrgKeys.leas(), 'list', filters] as const,
  lea: (id: string) => [...edOrgKeys.leas(), 'detail', id] as const,
  escs: () => [...edOrgKeys.all, 'escs'] as const,
  escList: (filters?: Partial<EscFilterDto>) => [...edOrgKeys.escs(), 'list', filters] as const,
  esc: (id: string) => [...edOrgKeys.escs(), 'detail', id] as const,
  networks: () => [...edOrgKeys.all, 'networks'] as const,
  networkList: (filters?: Partial<NetworkFilterDto>) => [...edOrgKeys.networks(), 'list', filters] as const,
  network: (id: string) => [...edOrgKeys.networks(), 'detail', id] as const,
  networkMembers: (networkId: string) => [...edOrgKeys.networks(), networkId, 'members'] as const,
}

// ============================================================================
// HIERARCHY
// ============================================================================

export function useOrganizationHierarchy(enabled = true) {
  return useQuery<OrganizationHierarchyResponseDto, Error>({
    queryKey: edOrgKeys.hierarchy(),
    queryFn: () => getOrganizationHierarchy(),
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

// ============================================================================
// SEA (State Education Agency)
// ============================================================================

export function useStateEducationAgency(enabled = true) {
  return useQuery<SeaResponseDto | null, Error>({
    queryKey: edOrgKeys.sea(),
    queryFn: getStateEducationAgency,
    enabled,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useCreateOrUpdateSea() {
  const queryClient = useQueryClient()

  return useMutation<SeaResponseDto, Error, CreateStateEducationAgencyDto>({
    mutationFn: (data) => createOrUpdateStateEducationAgency(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: edOrgKeys.sea() })
      queryClient.invalidateQueries({ queryKey: edOrgKeys.hierarchy() })
      toast.success('State Education Agency saved successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save State Education Agency')
    },
  })
}

// ============================================================================
// LEA (Local Education Agency)
// ============================================================================

export function useLocalEducationAgencies(filters?: Partial<LeaFilterDto>, enabled = true) {
  return useQuery<LeaListResponseDto, Error>({
    queryKey: edOrgKeys.leaList(filters),
    queryFn: () => getLocalEducationAgencies(filters),
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useLocalEducationAgency(id: string, enabled = true) {
  return useQuery<LeaResponseDto, Error>({
    queryKey: edOrgKeys.lea(id),
    queryFn: () => getLocalEducationAgency(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateLea() {
  const queryClient = useQueryClient()

  return useMutation<LeaResponseDto, Error, CreateLocalEducationAgencyDto>({
    mutationFn: (data) => createLocalEducationAgency(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: edOrgKeys.leas() })
      queryClient.invalidateQueries({ queryKey: edOrgKeys.hierarchy() })
      toast.success('District created successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create district')
    },
  })
}

export function useUpdateLea() {
  const queryClient = useQueryClient()

  return useMutation<
    LeaResponseDto,
    Error,
    { id: string; data: UpdateLocalEducationAgencyDto }
  >({
    mutationFn: ({ id, data }) => updateLocalEducationAgency(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: edOrgKeys.leas() })
      queryClient.setQueryData(edOrgKeys.lea(variables.id), data)
      queryClient.invalidateQueries({ queryKey: edOrgKeys.hierarchy() })
      toast.success('District updated successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update district')
    },
  })
}

export function useDeleteLea() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (id) => deleteLocalEducationAgency(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: edOrgKeys.leas() })
      queryClient.removeQueries({ queryKey: edOrgKeys.lea(id) })
      queryClient.invalidateQueries({ queryKey: edOrgKeys.hierarchy() })
      toast.success('District removed successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove district')
    },
  })
}

// ============================================================================
// ESC (Education Service Center)
// ============================================================================

export function useEducationServiceCenters(filters?: Partial<EscFilterDto>, enabled = true) {
  return useQuery<EscListResponseDto, Error>({
    queryKey: edOrgKeys.escList(filters),
    queryFn: () => getEducationServiceCenters(filters),
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useEducationServiceCenter(id: string, enabled = true) {
  return useQuery<EscResponseDto, Error>({
    queryKey: edOrgKeys.esc(id),
    queryFn: () => getEducationServiceCenter(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateEsc() {
  const queryClient = useQueryClient()

  return useMutation<EscResponseDto, Error, CreateEducationServiceCenterDto>({
    mutationFn: (data) => createEducationServiceCenter(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: edOrgKeys.escs() })
      queryClient.invalidateQueries({ queryKey: edOrgKeys.hierarchy() })
      toast.success('Education Service Center created successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create Education Service Center')
    },
  })
}

export function useUpdateEsc() {
  const queryClient = useQueryClient()

  return useMutation<
    EscResponseDto,
    Error,
    { id: string; data: UpdateEducationServiceCenterDto }
  >({
    mutationFn: ({ id, data }) => updateEducationServiceCenter(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: edOrgKeys.escs() })
      queryClient.setQueryData(edOrgKeys.esc(variables.id), data)
      queryClient.invalidateQueries({ queryKey: edOrgKeys.hierarchy() })
      toast.success('Education Service Center updated successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update Education Service Center')
    },
  })
}

export function useDeleteEsc() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (id) => deleteEducationServiceCenter(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: edOrgKeys.escs() })
      queryClient.removeQueries({ queryKey: edOrgKeys.esc(id) })
      queryClient.invalidateQueries({ queryKey: edOrgKeys.hierarchy() })
      toast.success('Education Service Center removed successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove Education Service Center')
    },
  })
}

// ============================================================================
// Networks (Education Organization Network)
// ============================================================================

export function useNetworks(filters?: Partial<NetworkFilterDto>, enabled = true) {
  return useQuery<NetworkListResponseDto, Error>({
    queryKey: edOrgKeys.networkList(filters),
    queryFn: () => getNetworks(filters),
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useNetwork(id: string, enabled = true) {
  return useQuery<NetworkResponseDto, Error>({
    queryKey: edOrgKeys.network(id),
    queryFn: () => getNetwork(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateNetwork() {
  const queryClient = useQueryClient()

  return useMutation<NetworkResponseDto, Error, CreateEducationOrgNetworkDto>({
    mutationFn: (data) => createNetwork(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: edOrgKeys.networks() })
      toast.success('Network created successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create network')
    },
  })
}

export function useUpdateNetwork() {
  const queryClient = useQueryClient()

  return useMutation<
    NetworkResponseDto,
    Error,
    { id: string; data: UpdateEducationOrgNetworkDto }
  >({
    mutationFn: ({ id, data }) => updateNetwork(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: edOrgKeys.networks() })
      queryClient.setQueryData(edOrgKeys.network(variables.id), data)
      toast.success('Network updated successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update network')
    },
  })
}

export function useDeleteNetwork() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (id) => deleteNetwork(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: edOrgKeys.networks() })
      queryClient.removeQueries({ queryKey: edOrgKeys.network(id) })
      toast.success('Network removed successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove network')
    },
  })
}

// ============================================================================
// Network Members (Associations)
// ============================================================================

export function useNetworkMembers(networkId: string, enabled = true) {
  return useQuery<NetworkAssociationListResponseDto, Error>({
    queryKey: edOrgKeys.networkMembers(networkId),
    queryFn: () => getNetworkMembers(networkId),
    enabled: enabled && !!networkId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useAddNetworkMember() {
  const queryClient = useQueryClient()

  return useMutation<
    NetworkAssociationResponseDto,
    Error,
    { networkId: string; data: CreateNetworkAssociationDto }
  >({
    mutationFn: ({ networkId, data }) => addNetworkMember(networkId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: edOrgKeys.networkMembers(variables.networkId) })
      toast.success('Member added to network')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add member')
    },
  })
}

export function useUpdateNetworkMember() {
  const queryClient = useQueryClient()

  return useMutation<
    NetworkAssociationResponseDto,
    Error,
    { networkId: string; memberId: string; data: UpdateNetworkAssociationDto }
  >({
    mutationFn: ({ networkId, memberId, data }) => updateNetworkMember(networkId, memberId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: edOrgKeys.networkMembers(variables.networkId) })
      toast.success('Member updated')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update member')
    },
  })
}

export function useRemoveNetworkMember() {
  const queryClient = useQueryClient()

  return useMutation<
    void,
    Error,
    { networkId: string; memberId: string }
  >({
    mutationFn: ({ networkId, memberId }) => removeNetworkMember(networkId, memberId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: edOrgKeys.networkMembers(variables.networkId) })
      toast.success('Member removed from network')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove member')
    },
  })
}
