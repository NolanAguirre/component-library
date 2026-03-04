import './App.css'
import Fold, { FoldTrigger, FoldContent } from './components/Fold/fold'
import Card, { CardHeader, CardSection, CardLabel, CardRow } from './components/Card/card'
import Row, { RowHeader, RowSection, RowLabel } from './components/Row/row'
import Form, {
  FormField,
  FormLabel,
  FormInput,
  FormTextarea,
  FormSelect,
  FormError,
  FormSubmit,
} from './components/Form/form'

const contactConfig = {
  fields: {
    name: {
      type: 'text',
      defaultValue: '',
      required: true,
      minLength: 2,
    },
    email: {
      type: 'email',
      defaultValue: '',
      required: true,
    },
    age: {
      type: 'number',
      defaultValue: '',
      min: 1,
      max: 120,
    },
    role: {
      type: 'select',
      defaultValue: '',
      required: true,
      options: [
        { value: 'inspector', displayValue: 'Safety Inspector' },
        { value: 'supervisor', displayValue: 'Nuclear Supervisor' },
        { value: 'other', displayValue: 'Other' },
      ],
    },
    bio: {
      type: 'textarea',
      defaultValue: '',
      maxLength: 300,
    },
  },
}

const handleSubmit = (values) => {
  // eslint-disable-next-line no-console
  console.log('Submitted values:', values)
  alert(`Submitted!\n${JSON.stringify(values, null, 2)}`)
}

const App = () => (
  <div className="app">
    <h1>Component Library</h1>

    <h2>Form</h2>

    <Fold defaultOpen>
      <FoldTrigger>Contact Form</FoldTrigger>
      <FoldContent>
        <Form config={contactConfig} submit={handleSubmit}>
          <FormField name="name">
            <FormLabel>Full Name</FormLabel>
            <FormInput type="text" placeholder="Homer Simpson" />
            <FormError />
          </FormField>

          <FormField name="email">
            <FormLabel>Email</FormLabel>
            <FormInput type="email" placeholder="homer@springfield.gov" />
            <FormError />
          </FormField>

          <FormField name="age">
            <FormLabel>Age</FormLabel>
            <FormInput type="number" placeholder="39" />
            <FormError />
          </FormField>

          <FormField name="role">
            <FormLabel>Role</FormLabel>
            <FormSelect placeholder="Select a role…" />
            <FormError />
          </FormField>

          <FormField name="bio">
            <FormLabel>Bio</FormLabel>
            <FormTextarea placeholder="Tell us about yourself…" />
            <FormError />
          </FormField>

          <FormSubmit>Submit</FormSubmit>
        </Form>
      </FoldContent>
    </Fold>

    <h2>Card</h2>

    <Fold>
      <FoldTrigger>Home Address</FoldTrigger>
      <FoldContent>
        <Card>
          <CardHeader>Home Address</CardHeader>
          <CardSection>
            <CardLabel>Street</CardLabel>
            742 Evergreen Terrace
          </CardSection>
          <CardRow>
            <CardSection size={2}>
              <CardLabel>City</CardLabel>
              Springfield
            </CardSection>
            <CardSection>
              <CardLabel>State</CardLabel>
              Illinois
            </CardSection>
            <CardSection>
              <CardLabel>ZIP</CardLabel>
              62701
            </CardSection>
          </CardRow>
        </Card>
      </FoldContent>
    </Fold>

    <h2>Row</h2>

    <Fold>
      <FoldTrigger>Name</FoldTrigger>
      <FoldContent>
        <Row>
          <RowHeader>Name</RowHeader>
          <RowSection>
            <RowLabel>First</RowLabel>
            Homer
          </RowSection>
          <RowSection>
            <RowLabel>Middle</RowLabel>
            Jay
          </RowSection>
          <RowSection>
            <RowLabel>Last</RowLabel>
            Simpson
          </RowSection>
        </Row>
      </FoldContent>

    </Fold>

    <h2>Fold</h2>

    <Fold>
      <FoldTrigger>What is a Fold component?</FoldTrigger>
      <FoldContent>
        A Fold (also called an accordion or disclosure) is a collapsible
        section that shows or hides content when its trigger is activated.
        This implementation separates state management from display so both
        can be composed independently.
      </FoldContent>
    </Fold>

    <br />

    <Fold defaultOpen>
      <FoldTrigger>This one starts open</FoldTrigger>
      <FoldContent>
        Pass <code>defaultOpen</code> to the <code>Fold</code> HOC and the
        panel will be expanded on first render.
      </FoldContent>
    </Fold>
  </div>
)

export default App
