from api.serializers.company import CompanySerializer
num_pages = 20

def create_company(company_data):
    try:
        serializer = CompanySerializer(data=company_data)
        if serializer.is_valid():
            return serializer.save()
        else:
            print("serializer error", serializer.errors)
    except Exception as e:
        print(e)
