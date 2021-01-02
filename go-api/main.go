package main

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"fmt"
	"strings"
	"time"

	"github.com/divadvo/UBS2YNAB/go-api/csvExport"
	"github.com/divadvo/UBS2YNAB/go-api/ubsApi"
)

func main() {
	// Echo instance
	e := echo.New()

	// Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept},
	}))
	e.Use(middleware.StaticWithConfig(middleware.StaticConfig{
		Root:   "files",
		Browse: true,
	}))

	// Routes
	e.GET("/challenge", getChallenge)
	e.POST("/challenge-response", processChallengeResponse)

	// Start server
	e.Logger.Fatal(e.Start(":5001"))
}

type ChallengeData struct {
	ResponseString string `json:"responseString" xml:"responseString" form:"responseString" query:"responseString"`
	StartDate      string `json:"startDate" xml:"startDate" form:"startDate" query:"startDate"`
}

func processChallengeResponse(c echo.Context) error {
	u := new(ChallengeData)
	if err := c.Bind(u); err != nil {
		return err
	}

	responses := strings.Fields(strings.ToUpper(u.ResponseString))
	fmt.Println(responses)

	if ubsApi.SendAuthenticatorChallengeResponse(responses[0], responses[1], responses[2], responses[3]) {
		//export normal accounts
		accounts := ubsApi.GetAvailableAccounts()
		for index, element := range accounts {
			fmt.Println("Account ", index)
			fmt.Println("Alias: ", element.Alias)
			fmt.Println("Balance: ", element.Balance)
			fmt.Println("Try to export transactions")

			endDate := time.Now().Local().AddDate(0, 0, -3)
			csvExport.ExportNormalAccountToCSV(ubsApi.GetAccountTransactions(element.ID, 350, u.StartDate, endDate.Format("20060102")), element.Alias)
		}

		//export credit cards
		creditCardAccounts := ubsApi.GetAvailableCreditCardAccounts()
		for index, element := range creditCardAccounts {
			fmt.Println("Account ", index)
			fmt.Println("Alias: ", element.Alias)
			fmt.Println("Balance: ", element.Balance)

			creditCards := ubsApi.GetAvailableCreditCards(element.ID)
			for index, card := range creditCards {
				fmt.Println("-->Card ", index)
				fmt.Println("-->Alias: ", card.ProductText)

				fmt.Println("Versuche die Transaktionen zu exportieren...")
				cardTransactions, accountTransactions := ubsApi.GetCardTransactions(card.ID, 150, u.StartDate, time.Now().Local().AddDate(0, 0, -3).Format("20060102"))
				csvExport.ExportCreditCardToCSV(cardTransactions, accountTransactions, card.Alias)
			}
		}
	}

	return c.JSON(http.StatusOK, "done")
}

func getChallenge(c echo.Context) error {
	contractNumber := c.QueryParam("contractNumber")
	challenge := ubsApi.GetAuthenticatorChallenge(contractNumber)

	return c.String(http.StatusOK, challenge)
}
