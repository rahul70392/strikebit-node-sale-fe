import React from 'react'

export const Footer = () => {
  return (
    <footer className=''
          style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            width: "100%",
            marginBottom: "20px"
          }}
        >
          <div className=''
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "3rem"
            }}
          >
            <div className=''
              style={{
                display: "flex",
                justifyContent: "space-evenly"
              }}
            >
              <div>Privacy Policy</div>
              <div>Terms and Condition</div>
              <div>Support</div>
            </div>
            <div className=''
              style={{
                textAlign: "center"
              }}
            >
              © 2024 StrikeBit
            </div>
          </div>
        </footer>
  )
}
