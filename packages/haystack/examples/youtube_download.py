from haystack import Pipeline

from flashdata_haystack import FlashDataYouTubeDownloadStatus

pipe = Pipeline()
pipe.add_component("delivery", FlashDataYouTubeDownloadStatus())
# Replace with the receipt from an earlier authorized submission.
result = pipe.run({"delivery": {"job_id": "job_REPLACE-WITH-SAVED-RECEIPT"}})
print(result["delivery"]["result"])
