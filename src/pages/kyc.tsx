// KycPage.tsx
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Shield, CloudUpload } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// --- FIXES HERE: Using 'Account' instead of 'UserProfile' ---
import { insertKycSchema, type InsertKyc, type Account } from "../shared/schema";
// --- END FIXES ---

import { useUser } from "../context/UserContext";

// --- Static Data for Select Inputs ---
const countries = [
  { value: "AF", label: "Afghanistan" }, { value: "AL", label: "Albania" }, { value: "DZ", label: "Algeria" }, { value: "AS", label: "American Samoa" }, { value: "AD", label: "Andorra" }, { value: "AO", label: "Angola" }, { value: "AI", label: "Anguilla" }, { value: "AQ", label: "Antarctica" }, { value: "AG", label: "Antigua and Barbuda" }, { value: "AR", label: "Argentina" }, { value: "AM", label: "Armenia" }, { value: "AW", label: "Aruba" }, { value: "AU", label: "Australia" }, { value: "AT", label: "Austria" }, { value: "AZ", label: "Azerbaijan" }, { value: "BS", label: "Bahamas" }, { value: "BH", label: "Bahrain" }, { value: "BD", label: "Bangladesh" }, { value: "BB", label: "Barbados" }, { value: "BY", label: "Belarus" }, { value: "BE", label: "Belgium" }, { value: "BZ", label: "Belize" }, { value: "BJ", label: "Benin" }, { value: "BM", label: "Bermuda" }, { value: "BT", label: "Bhutan" }, { value: "BO", label: "Bolivia" }, { value: "BA", label: "Bosnia and Herzegovina" }, { value: "BW", label: "Botswana" }, { value: "BR", label: "Brazil" }, { value: "IO", label: "British Indian Ocean Territory" }, { value: "BN", label: "Brunei Darussalam" }, { value: "BG", label: "Bulgaria" }, { value: "BF", label: "Burkina Faso" }, { value: "BI", label: "Burundi" }, { value: "KH", label: "Cambodia" }, { value: "CM", label: "Cameroon" }, { value: "CA", label: "Canada" }, { value: "CV", label: "Cape Verde" }, { value: "KY", label: "Cayman Islands" }, { value: "CF", label: "Central African Republic" }, { value: "TD", label: "Chad" }, { value: "CL", label: "Chile" }, { value: "CN", label: "China" }, { value: "CX", label: "Christmas Island" }, { value: "CC", label: "Cocos (Keeling) Islands" }, { value: "CO", label: "Colombia" }, { value: "KM", label: "Comoros" }, { value: "CG", label: "Congo" }, { value: "CD", label: "Congo, Democratic Republic" }, { value: "CK", label: "Cook Islands" }, { value: "CR", label: "Costa Rica" }, { value: "CI", label: "Côte d'Ivoire" }, { value: "HR", label: "Croatia" }, { value: "CU", label: "Cuba" }, { value: "CY", label: "Cyprus" }, { value: "CZ", label: "Czech Republic" }, { value: "DK", label: "Denmark" }, { value: "DJ", label: "Djibouti" }, { value: "DM", label: "Dominica" }, { value: "DO", label: "Dominican Republic" }, { value: "EC", label: "Ecuador" }, { value: "EG", label: "Egypt" }, { value: "SV", label: "El Salvador" }, { value: "GQ", label: "Equatorial Guinea" }, { value: "ER", label: "Eritrea" }, { value: "EE", label: "Estonia" }, { value: "ET", label: "Ethiopia" }, { value: "FK", label: "Falkland Islands" }, { value: "FO", label: "Faroe Islands" }, { value: "FJ", label: "Fiji" }, { value: "FI", label: "Finland" }, { value: "FR", label: "France" }, { value: "GF", label: "French Guiana" }, { value: "PF", label: "French Polynesia" }, { value: "TF", label: "French Southern Territories" }, { value: "GA", label: "Gabon" }, { value: "GM", label: "Gambia" }, { value: "GE", label: "Georgia" }, { value: "DE", label: "Germany" }, { value: "GH", label: "Ghana" }, { value: "GI", label: "Gibraltar" }, { value: "GR", label: "Greece" }, { value: "GL", label: "Greenland" }, { value: "GD", label: "Grenada" }, { value: "GP", label: "Guadeloupe" }, { value: "GU", label: "Guam" }, { value: "GT", label: "Guatemala" }, { value: "GG", label: "Guernsey" }, { value: "GN", label: "Guinea" }, { value: "GW", label: "Guinea-Bissau" }, { value: "GY", label: "Guyana" }, { value: "HT", label: "Haiti" }, { value: "HM", label: "Heard Island & McDonald Islands" }, { value: "VA", label: "Vatican City" }, { value: "HN", label: "Honduras" }, { value: "HK", label: "Hong Kong" }, { value: "HU", label: "Hungary" }, { value: "IS", label: "Iceland" }, { value: "IN", label: "India" }, { value: "ID", label: "Indonesia" }, { value: "IR", label: "Iran" }, { value: "IQ", label: "Iraq" }, { value: "IE", label: "Ireland" }, { value: "IM", label: "Isle of Man" }, { value: "IL", label: "Israel" }, { value: "IT", label: "Italy" }, { value: "JM", label: "Jamaica" }, { value: "JP", label: "Japan" }, { value: "JE", label: "Jersey" }, { value: "JO", label: "Jordan" }, { value: "KZ", label: "Kazakhstan" }, { value: "KE", label: "Kenya" }, { value: "KI", label: "Kiribati" }, { value: "KP", label: "Korea, North" }, { value: "KR", label: "Korea, South" }, { value: "KW", label: "Kuwait" }, { value: "KG", label: "Kyrgyzstan" }, { value: "LA", label: "Laos" }, { value: "LV", label: "Latvia" }, { value: "LB", label: "Lebanon" }, { value: "LS", label: "Lesotho" }, { value: "LR", label: "Liberia" }, { value: "LY", label: "Libya" }, { value: "LI", label: "Liechtenstein" }, { value: "LT", label: "Lithuania" }, { value: "LU", label: "Luxembourg" }, { value: "MO", label: "Macao" }, { value: "MK", label: "North Macedonia" }, { value: "MG", label: "Madagascar" }, { value: "MW", label: "Malawi" }, { value: "MY", label: "Malaysia" }, { value: "MV", label: "Maldives" }, { value: "ML", label: "Mali" }, { value: "MT", label: "Malta" }, { value: "MH", label: "Marshall Islands" }, { value: "MQ", label: "Martinique" }, { value: "MR", "label": "Mauritania" }, { value: "MU", "label": "Mauritius" }, { value: "YT", "label": "Mayotte" }, { value: "MX", "label": "Mexico" }, { value: "FM", "label": "Micronesia" }, { value: "MD", "label": "Moldova" }, { value: "MC", "label": "Monaco" }, { value: "MN", "label": "Mongolia" }, { value: "ME", "label": "Montenegro" }, { value: "MS", "label": "Montserrat" }, { value: "MA", "label": "Morocco" }, { value: "MZ", "label": "Mozambique" }, { value: "MM", "label": "Myanmar" }, { value: "NA", "label": "Namibia" }, { value: "NR", "label": "Nauru" }, { value: "NP", "label": "Nepal" }, { value: "NL", "label": "Netherlands" }, { value: "NC", "label": "New Caledonia" }, { value: "NZ", "label": "New Zealand" }, { value: "NI", "label": "Nicaragua" }, { value: "NE", "label": "Niger" }, { value: "NG", "label": "Nigeria" }, { value: "NU", "label": "Niue" }, { value: "NF", "label": "Norfolk Island" }, { value: "MP", "label": "Northern Mariana Islands" }, { value: "NO", "label": "Norway" }, { value: "OM", "label": "Oman" }, { value: "PK", "label": "Pakistan" }, { value: "PW", "label": "Palau" }, { value: "PS", "label": "Palestinian Territory" }, { value: "PA", "label": "Panama" }, { value: "PG", "label": "Papua New Guinea" }, { value: "PY", "label": "Paraguay" }, { value: "PE", "label": "Peru" }, { value: "PH", "label": "Philippines" }, { value: "PN", "label": "Pitcairn" }, { value: "PL", "label": "Poland" }, { value: "PT", "label": "Portugal" }, { value: "PR", "label": "Puerto Rico" }, { value: "QA", "label": "Qatar" }, { value: "RE", "label": "Réunion" }, { value: "RO", "label": "Romania" }, { value: "RU", "label": "Russia" }, { value: "RW", "label": "Rwanda" }, { value: "BL", "label": "Saint Barthélemy" }, { value: "SH", "label": "Saint Helena" }, { value: "KN", "label": "Saint Kitts and Nevis" }, { value: "LC", "label": "Saint Lucia" }, { value: "MF", "label": "Saint Martin" }, { value: "PM", "label": "Saint Pierre and Miquelon" }, { value: "VC", "label": "Saint Vincent and the Grenadines" }, { value: "WS", "label": "Samoa" }, { value: "SM", "label": "San Marino" }, { value: "ST", "label": "Sao Tome and Principe" }, { value: "SA", "label": "Saudi Arabia" }, { value: "SN", "label": "Senegal" }, { value: "RS", "label": "Serbia" }, { value: "SC", "label": "Seychelles" }, { value: "SL", "label": "Sierra Leone" }, { value: "SG", "label": "Singapore" }, { value: "SX", "label": "Sint Maarten" }, { value: "SK", "label": "Slovakia" }, { value: "SI", label: "Slovenia" }, { value: "SB", "label": "Solomon Islands" }, { value: "SO", "label": "Somalia" }, { value: "ZA", "label": "South Africa" }, { value: "GS", "label": "South Georgia & South Sandwich Islands" }, { value: "SS", "label": "South Sudan" }, { value: "ES", "label": "Spain" }, { value: "LK", "label": "Sri Lanka" }, { value: "SD", "label": "Sudan" }, { value: "SR", "label": "Suriname" }, { value: "SJ", "label": "Svalbard and Jan Mayen" }, { value: "SZ", "label": "Swaziland" }, { value: "SE", "label": "Sweden" }, { value: "CH", "label": "Switzerland" }, { value: "SY", "label": "Syrian Arab Republic" }, { value: "TW", "label": "Taiwan" }, { value: "TJ", "label": "Tajikistan" }, { value: "TZ", "label": "Tanzania" }, { value: "TH", "label": "Thailand" }, { value: "TL", "label": "Timor-Leste" }, { value: "TG", "label": "Togo" }, { value: "TK", "label": "Tokelau" }, { value: "TO", "label": "Tonga" }, { value: "TT", "label": "Trinidad and Tobago" }, { value: "TN", "label": "Tunisia" }, { value: "TR", "label": "Turkey" }, { value: "TM", "label": "Turkmenistan" }, { value: "TC", "label": "Turks and Caicos Islands" }, { value: "TV", "label": "Tuvalu" }, { value: "UG", "label": "Uganda" }, { value: "UA", "label": "Ukraine" }, { value: "AE", "label": "United Arab Emirates" }, { value: "GB", "label": "United Kingdom" }, { value: "US", "label": "United States" }, { value: "UM", "label": "United States Minor Outlying Islands" }, { value: "UY", "label": "Uruguay" }, { value: "UZ", "label": "Uzbekistan" }, { value: "VU", "label": "Vanuatu" }, { value: "VE", "label": "Venezuela" }, { value: "VN", "label": "Vietnam" }, { value: "VG", "label": "Virgin Islands, British" }, { value: "VI", "label": "Virgin Islands, U.S." }, { value: "WF", "label": "Wallis and Futuna" }, { value: "EH", "label": "Western Sahara" }, { value: "YE", "label": "Yemen" }, { value: "ZM", "label": "Zambia" }, { value: "ZW", "label": "Zimbabwe" },
];

const documentTypes = [
  { value: "passport", label: "Passport", icon: "🛂" },
  { value: "id", label: "ID Card", icon: "🆔" },
  { value: "license", label: "License", icon: "🪪" },
];
// --- End Static Data ---

export default function KycPage() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { refetchUser } = useUser();

  // Initialize react-hook-form with Zod resolver for schema validation
  const form = useForm<InsertKyc>({
    resolver: zodResolver(insertKycSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      country: "",
      documentType: "passport",
      accessCode: "",
      email: "",
    },
  });

  // Mutation for creating a new account (and implicitly, a KYC record)
  // The 'data' parameter here should strictly match the 'InsertKyc' type.
  const createAccountMutation = useMutation({
    mutationFn: async (data: InsertKyc) => {
      // Sends a POST request to the http://myblog.alwaysdata.net/api/account endpoint with the KYC payload
      const response = await apiRequest("POST", "http://myblog.alwaysdata.net/api/account", data);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || "Failed to create account or submit KYC");
      }
      // --- FIX HERE: Assuming backend returns an 'Account' type ---
      return response.json() as Promise<Account>;
    },
    // --- FIX HERE: Using 'Account' for the success data type ---
    onSuccess: async (data: Account) => {
      console.log("KYC submission successful response (account data):", data);

      toast({
        title: "KYC Verification Submitted",
        description: "Your KYC information has been submitted. Please wait for verification.",
      });

      // --- Automatic Login and Profile Update Logic ---
      try {
        // Assuming the backend response `data` contains `id` and `email` for the created user/account
        if (data.id && data.email) {
          localStorage.setItem("userId", data.id);
          localStorage.setItem("userEmail", data.email);
          await refetchUser();
          toast({
            title: "Profile Updated",
            description: "Your profile has been updated and you are now logged in.",
            variant: "success",
          });
          form.reset(); // <-- Move here
          setLocation("/market");
        } else {
          toast({
            title: "KYC Submitted",
            description: "Your KYC is submitted. Please log in manually.",
            variant: "info",
          });
          form.reset(); // <-- Move here
          setLocation("/login");
        }
      } catch (profileUpdateError: any) {
        console.error("Auto-profile update/login failed after KYC:", profileUpdateError);
        toast({
          title: "Profile Update Failed",
          description: profileUpdateError.message || "Failed to update profile after KYC. Please log in manually.",
          variant: "destructive",
        });
        setLocation("/login");
      }
      // --- End Automatic Login Logic ---
    },
    onError: (error: any) => {
      console.error("KYC Submission Failed:", error);
      toast({
        title: "KYC Submission Failed",
        description: error.message || "Please check your information and try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: InsertKyc) => {
    // Client-side check for document selection (the file itself is not sent in this payload)
    if (!selectedFile) {
      toast({
        title: "Document Required",
        description: "Please select an identification document.",
        variant: "destructive",
      });
      return;
    }

    toast({
        title: "Document Selected (Frontend Only)",
        description: `You selected: ${selectedFile.name}`,
        variant: "info",
    });

    createAccountMutation.mutate(data);
  };

  return (
    <div className="min-h-screen crypto-dark">
      <div className="crypto-surface">
        {/* Header Section */}
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setLocation("/market")}
            className="text-slate-400 hover:text-slate-300 transition-colors"
            title="Go to Market"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h2 className="text-lg font-semibold text-white">KYC Verification</h2>
          <div className="w-6"></div> {/* Spacer for symmetrical layout */}
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Progress Indicator Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Verification Progress</span>
            <span className="text-sm text-crypto-blue font-medium">Step {step} of 1</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="crypto-blue h-2 rounded-full transition-all duration-300"
              style={{ width: `100%` }}
            />
          </div>
        </div>

        {/* KYC Form Section */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Country Selection Field */}
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300 font-medium">Country/Region *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="crypto-surface border-slate-600 text-white focus:border-crypto-blue">
                        <SelectValue placeholder="Please select a country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Personal Information Fields (First Name, Last Name) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300 font-medium">First Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Please enter your first name"
                        className="crypto-surface border-slate-600 text-white placeholder-slate-400 focus:border-crypto-blue"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300 font-medium">Last Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Please enter your last name"
                        className="crypto-surface border-slate-600 text-white placeholder-slate-400 focus:border-crypto-blue"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Document Type Selection */}
            <FormField
              control={form.control}
              name="documentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300 font-medium">Document Type *</FormLabel>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    {documentTypes.map((docType) => (
                      <button
                        key={docType.value}
                        type="button"
                        onClick={() => field.onChange(docType.value)}
                        className={`crypto-surface border rounded-lg px-4 py-3 text-center transition-colors ${
                          field.value === docType.value
                            ? "border-crypto-blue bg-blue-50 bg-opacity-10"
                            : "border-slate-600 hover:border-crypto-blue"
                        }`}
                      >
                        <div className="text-crypto-blue text-xl mb-2">{docType.icon}</div>
                        <div className="text-sm text-white">{docType.label}</div>
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email Address Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300 font-medium">Email Address *</FormLabel>
                  <div className="flex space-x-2 mt-3">
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Please enter your email"
                        className="flex-1 crypto-surface border-slate-600 text-white placeholder-slate-400 focus:border-crypto-blue"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Access Code Field */}
            <FormField
              control={form.control}
              name="accessCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300 font-medium">Access Code *</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Please enter access code"
                      className="crypto-surface border-slate-600 text-white placeholder-slate-400 focus:border-crypto-blue"
                      {...field}
                      autoComplete="new-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Document Upload Area (Client-side only for this demo) */}
            <div>
              <FormLabel className="text-slate-300 font-medium">Document Upload*</FormLabel>
              <div
                className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center mt-3 hover:border-crypto-blue transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <CloudUpload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400 mb-2">
                  {selectedFile ? `Selected: ${selectedFile.name}` : "Drop your document here or click to select"}
                </p>
                <p className="text-xs text-slate-500">Supports: JPG, PNG, PDF (max 10MB) - (Not uploaded to server)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".jpg,.png,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                      toast({
                        title: "File Selected",
                        description: `Selected: ${file.name} `,
                        variant: "info",
                      });
                    }
                  }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={createAccountMutation.isPending}
              className="w-full crypto-blue text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-600 transition-colors"
            >
              {createAccountMutation.isPending ? "Processing..." : "Continue Verification"}
            </Button>
          </form>
        </Form>

        {/* Form Validation Error Message */}
        {form.formState.isSubmitted && !form.formState.isValid && !createAccountMutation.isSuccess && (
          <div className="mt-4 p-3 bg-red-900 bg-opacity-20 border border-red-500 rounded-lg text-red-400 text-sm text-center">
          </div>
        )}
         <style>
        {`
          li[role="status"][data-state="open"] {
            background-color: white;
            color: black;
          }
        `}
      </style>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-yellow-500 bg-opacity-10 border border-yellow-500 border-opacity-30 rounded-lg">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-yellow-500 mt-1" />
            <div>
              <h4 className="font-medium text-yellow-500 mb-1">Security Notice</h4>
              <p className="text-sm text-slate-300">
                Your personal information is encrypted and securely stored.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}