from bson import ObjectId

def convert_objectid_in_doc(doc):
    if isinstance(doc, list):
        return [convert_objectid_in_doc(d) for d in doc]
    if isinstance(doc, dict):
        return {k: convert_objectid_in_doc(v) for k, v in doc.items()}
    if isinstance(doc, ObjectId):
        return str(doc)
    return doc


