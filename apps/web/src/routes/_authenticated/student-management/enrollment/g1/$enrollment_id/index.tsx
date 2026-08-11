import { createFileRoute } from "@tanstack/react-router"
import { WizardShell } from "@/components/enrollment/g1/wizard/wizard-shell"
import { apiClient } from "@/lib/api-client"
import {
  getApplicationOptions,
  getApplicationGuardiansOptions,
  getApplicationAddressesOptions,
  getApplicationSiblingsOptions,
  getApplicationDocumentsOptions,
  getChildOptions,
  listAddressesOptions,
  listGuardiansOptions,
} from "@/lib/api-client/@tanstack/react-query.gen"

export const Route = createFileRoute(
  "/_authenticated/student-management/enrollment/g1/$enrollment_id/"
)({
  loader: async ({ context, params }) => {
    const { queryClient } = context
    const enrollmentId = params.enrollment_id

    const application = await queryClient.ensureQueryData(
      getApplicationOptions({ path: { id: enrollmentId }, client: apiClient })
    )

    await Promise.all([
      queryClient.ensureQueryData(listGuardiansOptions({ client: apiClient })),
      queryClient.ensureQueryData(
        getApplicationGuardiansOptions({
          path: { id: enrollmentId },
          client: apiClient,
        })
      ),
      queryClient.ensureQueryData(
        getApplicationAddressesOptions({
          path: { id: enrollmentId },
          client: apiClient,
        })
      ),
      queryClient.ensureQueryData(
        getApplicationSiblingsOptions({
          path: { id: enrollmentId },
          client: apiClient,
        })
      ),
      queryClient.ensureQueryData(
        getApplicationDocumentsOptions({
          path: { id: enrollmentId },
          client: apiClient,
        })
      ),
      queryClient.ensureQueryData(listAddressesOptions({ client: apiClient })),
      ...(application.child_id
        ? [
            queryClient.ensureQueryData(
              getChildOptions({
                path: { id: application.child_id },
                client: apiClient,
              })
            ),
          ]
        : []),
    ])
  },
  component: RouteComponent,
})

function RouteComponent() {
  return <WizardShell />
}
