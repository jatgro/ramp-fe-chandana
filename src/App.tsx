import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading] = useState(false)

  const [hideViewMore, setHideViewMore] = useState(false)

  useEffect(() => {
    if (paginatedTransactions?.nextPage === null) {
      setHideViewMore(true)
    }
  }, [paginatedTransactions?.nextPage])

  const transactions = useMemo(() => {
    return paginatedTransactions?.data ?? transactionsByEmployee ?? null
  }, [paginatedTransactions, transactionsByEmployee])

  const loadNewTransactions = useMemo(() => {
    return async () => {
      await paginatedTransactionsUtils.fetchNew?.()
    }
  }, [paginatedTransactionsUtils])

  const loadEmployees = useCallback(async () => {
    setIsLoading(true)
    transactionsByEmployeeUtils.invalidateData()

    await employeeUtils.fetchAll()
    setIsLoading(false)
  }, [employeeUtils, transactionsByEmployeeUtils])

  const loadAllTransactions = useCallback(async () => {
    paginatedTransactionsUtils.invalidateData()
    loadEmployees()
    await paginatedTransactionsUtils.fetchAll()
    setHideViewMore(false)
  }, [loadEmployees, paginatedTransactionsUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData()
      setHideViewMore(true)
      await transactionsByEmployeeUtils.fetchById(employeeId)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadEmployees()
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions, loadEmployees])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null) {
              return
            } else if (newValue === EMPTY_EMPLOYEE) {
              loadAllTransactions()
            } else {
              await loadTransactionsByEmployee(newValue.id)
            }
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />

          {transactions !== null && (
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading}
              hidden={hideViewMore}
              onClick={async () => {
                await loadNewTransactions()
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}
