/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import BillsUI from "../views/BillsUI.js"
import Bills from "../containers/Bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"
import { bills } from "../fixtures/bills.js"
import router from "../app/Router.js";
jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //Adding the expect line
      expect(windowIcon.classList.contains('active-icon')).toBe(true)
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
})

//GET bills
describe("Given I am a user connected as Employee", () => {
  describe("When I am on Bills Page", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByText("Mes notes de frais"))
    })
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills")
        Object.defineProperty(
            window,
            'localStorage',
            { value: localStorageMock }
        )
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee',
          email: "a@a"
        }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.appendChild(root)
        router()
      })

      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list : () =>  {
              return Promise.reject(new Error("Erreur 404"))
            }
          }
        })
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick)
        const message = await screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })

      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list : () =>  {
              return Promise.reject(new Error("Erreur 500"))
            }
          }
        })
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick)
        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })
    })
  })
})

// Testing the handleClickIconEye function
describe('Given I am connected as Employee and I am on Bills page', () => {
  describe('When I click on the icon eye', () => {
    test("It should launch the handkeClickIconEye function", () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      //Using test data and put it in the document
      document.body.innerHTML = BillsUI({ data: bills })
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const store = null
      //Creation of an instance of Bills
      const billsInit = new Bills({
        document, onNavigate, store, localStorage: window.localStorage
      })
      //Getting the first icon eye
      const eye = screen.getAllByTestId('icon-eye')[0]
      //Mocking the modal function
      $.fn.modal = jest.fn()
      //Mocking the handleClickIconEye function
      const handleClickIconEye = jest.fn(() => billsInit.handleClickIconEye(eye))
      eye.addEventListener('click', handleClickIconEye)
      //Simulation of a click on the icon
      userEvent.click(eye)
      expect(handleClickIconEye).toHaveBeenCalled()
    })
  })
})

//Testing the path to the NewBill page
describe("Given I am a user connected as Employee", () => {
  describe("When I click on the button to create a new bill, it should render the NewBill page", () => {
    test("It should render NewBill page", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      //Using test data and put it in the document
      document.body.innerHTML = BillsUI({ data: bills })
      const store = null
      //Creation of an instance of Bills
      const billsUI = new Bills({
        document, onNavigate, store, localStorage: window.localStorage
      })
      //Mocking the handleClickNewBill function
      const handleClickNewBill = jest.fn(billsUI.handleClickNewBill)
      //Getting the new bill button
      const btnNewBill = screen.getByTestId("btn-new-bill")
      btnNewBill.addEventListener("click", handleClickNewBill)
      //Simulation of a click on the button
      userEvent.click(btnNewBill)
      expect(handleClickNewBill).toHaveBeenCalled()
      expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy()
    })
  })
})