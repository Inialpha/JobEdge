import filetype
import pymupdf
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile

def use_pymupdf(filename):
    doc = pymupdf.open(stream=filename)
    text = ""
    for page in doc:
        text += page.get_text()
    return text

#def use_textract(filename):
#    try:
#        text = textract.process(filename)
#        return text.decode('utf-8')
#    except textract.exceptions.ShellError:
#        return None

class File:
    """ A file class """
    def __init__(self, filename):
        """ initialize a file """
        if isinstance(filename, InMemoryUploadedFile):
            self.name = BytesIO(filename.read())
        else:
            self.name = filename
        self.type = self._get_type()
        self.content = ""
        self.extention = ""
        self.text = self._get_text()

    def _get_type(self):
        try:
            return filetype.guess(self.name).mime
        except AttributeError:
            return None

    def _get_extention(self):
        try:
            return filetype.guess(self.name).extention
        except AttributeError:
            return None
    def _get_text(self):

        if self.type == "application/pdf":
            return use_pymupdf(self.name)

        if self.type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            pass
            #return use_textract(self.name)




if __name__ == "__main__":
    file_path = "ini.pdf"
    file = File(file_path)

    print(file.text)
    print("_" * 30)
    import ai

    ai.ai(file.text)
