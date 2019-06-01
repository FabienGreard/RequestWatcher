const { htm } = require('@zeit/integration-utils');

module.exports = (title, content, back = true) => htm`
    <Page>
      <Box 
      display="flex" 
      alignItems="flex-end" 
      padding="20px 15px" 
      margin="20px 0px"
      borderBottom="1px solid #eaeaea"
      background="#fff"
      >
        ${
          back
            ? htm`<Box marginRight="20px"><Button action="reset" small secondary>Back</Button></Box>`
            : ''
        }
        <H1>${title}</H1>
      </Box>
      <Box>
        ${content}
      </Box>
    </Page>`;
