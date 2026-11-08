import { PageHeader } from '@/components/PageHeader'
import { useDocumentTitle } from '../../app/useDocumentTitle'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RunsTab } from './RunsTab'
import { TransactionsTab } from './TransactionsTab'
import { parseTab, useAdminParams } from './useAdminParams'

/** The admin area: sync runs and transaction management, in tabs kept in the URL. */
export function AdminPage() {
  const { tab, setTab } = useAdminParams()
  useDocumentTitle('Admin')
  return (
    <>
      <PageHeader title="Admin" description="Sync runs of the extraction service." />
      <Tabs value={tab} onValueChange={(value) => setTab(parseTab(value))}>
        <TabsList aria-label="Admin sections">
          <TabsTrigger value="runs">Runs</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        <TabsContent value="runs">
          <RunsTab />
        </TabsContent>
        <TabsContent value="transactions">
          <TransactionsTab />
        </TabsContent>
      </Tabs>
    </>
  )
}
