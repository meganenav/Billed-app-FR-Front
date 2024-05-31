/**
 * @jest-environment jsdom
 */
import {fireEvent, screen, waitFor} from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"
import router from "../app/Router"
jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then it should display the form", () => {
      //Creating the test page
      document.body.innerHTML = NewBillUI()
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      expect(screen.getByTestId(`form-new-bill`)).toBeTruthy()
    })
  })
})

//Form sending
describe("Given I am a user connected as Employee", () => {
  describe("When I am on NewBill Page", () => {
    test("File is correct and all data are sent", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      //Creating the test page
      document.body.innerHTML = NewBillUI()
      const store = mockStore
      //Creation of an instance of NewBill
      const newBill = new NewBill({
        document, onNavigate, store, localStorage: window.localStorage,
      })
      //Creation of a mock on the function handleSubmit
      const spyHandleSubmit = jest.spyOn(newBill, "handleSubmit")
      //Creation of the test data
      const testData = {
        type: "Transports",
        name: "Voyage Alsace",
        amount: "400",
        date: "2022-08-22",
        vat: 20,
        pct: 80,
        file: new File(["img"], "image.png", { type: "image/png" }),
        commentary: "Test envoi formulaire",
        status: "pending",
      }
      //Value assignment in the form
      screen.getByTestId("expense-type").value = testData.type
      screen.getByTestId("expense-name").value = testData.name
      screen.getByTestId("amount").value = testData.amount
      screen.getByTestId("datepicker").value = testData.date
      screen.getByTestId("vat").value = testData.pct
      screen.getByTestId("commentary").value = testData.commentary
      
      const testFile = screen.getByTestId("file")
      //Creation of a mock on the function handleSubmit
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))

      //Getting the form and adding an eventListener on submit
      const form = screen.getByTestId("form-new-bill")
      form.addEventListener("submit", handleSubmit)

      //Simulation of the file upload
      userEvent.upload(testFile, testData.file)
      expect(testFile.files["0"]).toEqual(testData.file)
      //Simulation of the form sending
      fireEvent.submit(form)
      expect(spyHandleSubmit).toHaveBeenCalled()
    })
  })
})

//POST NewBill
describe("Given I am a user connected as Employee", () => {
  describe("When I am on NewBill Page", () => {
    test("send bill to mock API POST", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByText("Envoyer une note de frais"))
    })
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        //Using data from the mockStore
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
      test("send bill to API and fails with 404 message error", async () => { 
        //Mocking the console.error function
        const consoleError = jest.spyOn(console, "error").mockImplementation()
        //Mocking the update function from bills to get a 404 error
        mockStore.bills.mockImplementationOnce(() => { 
          return { 
            update: () => { 
              return Promise.reject(new Error("Erreur 404")) 
            } 
          } 
        }) 
        // Navigation to the page NewBill 
        document.body.innerHTML = NewBillUI() 
        const onNavigate = (pathname) => { 
          document.body.innerHTML = ROUTES({ pathname }) 
        }
        Object.defineProperty(window, 'localStorage', { value: localStorageMock }) 
        window.localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: "a@a" }))
        //Creation of an instance of NewBill 
        const newBill = new NewBill({ 
          document, onNavigate, store: mockStore, localStorage: window.localStorage 
        }) 
        //Simulation of the assignment of test values in the form
        fireEvent.change(screen.getByTestId('expense-type'), { target: { value: 'Transports' } }) 
        fireEvent.change(screen.getByTestId('expense-name'), { target: { value: 'Voyage Alsace' } }) 
        fireEvent.change(screen.getByTestId('amount'), { target: { value: '400' } }) 
        fireEvent.change(screen.getByTestId('datepicker'), { target: { value: '2022-08-22' } }) 
        fireEvent.change(screen.getByTestId('vat'), { target: { value: '20' } }) 
        fireEvent.change(screen.getByTestId('pct'), { target: { value: '80' } }) 
        fireEvent.change(screen.getByTestId('commentary'), { target: { value: 'Test 404' } }) 
        //Simulation of the click to send the form
        const submit = screen.getByTestId('form-new-bill') 
        fireEvent.submit(submit) 
        //Waiting and check if the 404 error message is displayed
        await waitFor(() => {
          expect(consoleError.mock.calls[0][0]).toMatchObject(/[Error: Erreur 404]/)
        })
        //Clear the console
        consoleError.mockClear()
      })

      test("send bill to API and fails with 500 message error", async () => {
        //Mocking the console.error function
        const consoleError = jest.spyOn(console, "error").mockImplementation();
        //Mocking the update function from bills to get a 500 error
        mockStore.bills.mockImplementationOnce(() => { 
          return { 
            update: () => { 
              return Promise.reject(new Error("Erreur 500")) 
            } 
          } 
        }) 
        // Navigation to the page NewBill 
        document.body.innerHTML = NewBillUI() 
        const onNavigate = (pathname) => { 
          document.body.innerHTML = ROUTES({ pathname }) 
        }
        Object.defineProperty(window, 'localStorage', { value: localStorageMock }) 
        window.localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: "a@a" })) 
        //Creation of an instance of NewBill 
        const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage }) 
        //Simulation of the assignment of test values in the form
        fireEvent.change(screen.getByTestId('expense-type'), { target: { value: 'Transports' } }) 
        fireEvent.change(screen.getByTestId('expense-name'), { target: { value: 'Voyage Alsace' } }) 
        fireEvent.change(screen.getByTestId('amount'), { target: { value: '400' } }) 
        fireEvent.change(screen.getByTestId('datepicker'), { target: { value: '2022-08-22' } }) 
        fireEvent.change(screen.getByTestId('vat'), { target: { value: '20' } }) 
        fireEvent.change(screen.getByTestId('pct'), { target: { value: '80' } }) 
        fireEvent.change(screen.getByTestId('commentary'), { target: { value: 'Test 500' } }) 
        //Simulation of the click to send the form
        const submit = screen.getByTestId('form-new-bill') 
        fireEvent.submit(submit) 
        //Waiting and check if the 500 error message is displayed
        await waitFor(() => {
          expect(consoleError.mock.calls[0][0]).toMatchObject(/[Error: Erreur 500]/)
        }) 
        //Clear the console
        consoleError.mockClear()
      })
    })
  })
})