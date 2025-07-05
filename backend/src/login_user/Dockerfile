FROM public.ecr.aws/lambda/python:3.11

# Copy requirements file
COPY requirements.txt ${LAMBDA_TASK_ROOT}

# Install the specified packages
RUN pip install -r requirements.txt

# Copy function code
COPY handler.py ${LAMBDA_TASK_ROOT}
COPY models.py ${LAMBDA_TASK_ROOT}
COPY service.py ${LAMBDA_TASK_ROOT}
COPY repository.py ${LAMBDA_TASK_ROOT}
COPY cognito_client.py ${LAMBDA_TASK_ROOT}
COPY errors.py ${LAMBDA_TASK_ROOT}
COPY __init__.py ${LAMBDA_TASK_ROOT}

# Set the CMD to your handler
CMD ["handler.lambda_handler"]
